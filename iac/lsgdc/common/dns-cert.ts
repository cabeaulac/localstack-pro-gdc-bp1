import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {
    mkItemName,
    mkTagsWithName,
    siteDomainName,
    hostedZoneId,
    PulumiUtil,
    eastRegion,
} from "../../iac-shared";

// used to keep TS happy after the apply below
interface recordConvertValue {
    name: string;
    record: string;
    type: string;
}


// const getZone = (): aws.route53.Zone | undefined => {
//     if (!PulumiUtil.instance().isLocal) {
//         pulumi.log.info(">>> hostedZoneName: " + hostedZoneName);
//         return aws.route53.Zone.get(
//             mkItemName("siteZoneId"),
//             aws.route53
//                 .getZone(
//                     {name: hostedZoneName, privateZone: false},
//                     {provider: PulumiUtil.instance().awsProvider}
//                 )
//                 .then((zone) => zone.id),
//             {},
//             {provider: PulumiUtil.instance().awsProvider} // need to use eaSharedProvider to access DNS
//         );
//     }
//     return undefined;
// };
// export const hostedZone = getZone();

const getCertificate = (): aws.acm.Certificate | undefined => {
    if (PulumiUtil.instance().isLocal) {
        return undefined;
    }
    return new aws.acm.Certificate(
        mkItemName("siteCert"),
        {
            domainName: siteDomainName,
            // subjectAlternativeNames: [],
            validationMethod: "DNS",
            tags: mkTagsWithName("siteCert"),
        },
        {provider: eastRegion} // make sure certs are in east-1
    );
};
export const siteCert = getCertificate();

// used to create DNS validation records for cert
// roughly based on the horribly broken example on pulumi's site
//if (!PulumiUtil.instance().isLocal) {

const getCertificateValidation = (
    cert: aws.acm.Certificate | undefined
): aws.acm.CertificateValidation | undefined => {
    if (PulumiUtil.instance().isLocal || !cert) {
        return undefined;
    }
    const domainValidationRecords = cert.domainValidationOptions.apply(
        (o) => {
            const dnsRecords: aws.route53.Record[] = [];
            for (const range of Object.entries(
                o.reduce((a, dvo) => {
                    return {
                        ...a,
                        [dvo.domainName]: {
                            name: dvo.resourceRecordName,
                            record: dvo.resourceRecordValue,
                            type: dvo.resourceRecordType,
                        },
                    };
                }, {})
            ).map(([k, v]) => {
                return {key: k, value: v as recordConvertValue};
            })) {
                // start of for loop body
                dnsRecords.push(
                    new aws.route53.Record( // domain validation record
                        mkItemName(`dvRecord-${range.key}`),
                        {
                            allowOverwrite: true,
                            name: range.value.name,
                            records: [range.value.record],
                            ttl: 60,
                            type: range.value.type,
                            zoneId: hostedZoneId,
                        },
                        {provider: PulumiUtil.instance().awsProvider} // need to use eaSharedProvider to access DNS
                    ) // new aws.route53.Record
                ); // dnsRecords.push
            } // end of for loop body
            return dnsRecords;
        } // end apply cbf
    );
    // validate cert using dns records created above
    return new aws.acm.CertificateValidation(
        mkItemName("certificateValidation"),
        {
            certificateArn: cert.arn,
            validationRecordFqdns: domainValidationRecords.apply(
                (recs: aws.route53.Record[]) => recs.map((record) => record.fqdn)
            ),
        },
        {provider: eastRegion} // make sure cert validation is in east-1
    );
};

export const certificateValidation = getCertificateValidation(
    siteCert
);
