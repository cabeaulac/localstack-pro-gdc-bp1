import {ref} from 'vue';

export const titleCase = (str: string, sep: string = ' '): string => {
  if (!str) return '';
  // console.log(str.toLowerCase().split(/[ _-]/));
  return str
    .toLowerCase()
    .split(/[ _-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(sep);
};

export const randomRangeInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + ' ' + units[u];
}

export const validateEmail = (email: string) => {
  if (email != '') {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const emailTest = re.test(String(email).toLowerCase());
    return emailTest;
  }
  return false;
};

export const validatePhone = (phone: string) => {
  if (phone != '') {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    const phoneTest = re.test(String(phone).toLowerCase());
    return phoneTest;
  }
  return false;
};

export const objectFlip = (obj: { [key: string]: string }) => {
  return Object.keys(obj).reduce((ret: {
    [key: string]: string
  }, key: string) => {
    ret[obj[key]] = key;
    return ret;
  }, {});
};

export const statesList = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

export const stateAbbrevToName: { [key: string]: string } = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming'
};

export const stateNameToAbbrev = objectFlip(stateAbbrevToName);

export const statesDictList = [{
  'nm': 'Alabama',
  'abbrev': 'AL'
}, {'nm': 'Alaska', 'abbrev': 'AK'}, {
  'nm': 'Arizona',
  'abbrev': 'AZ'
}, {'nm': 'Arkansas', 'abbrev': 'AR'}, {
  'nm': 'California',
  'abbrev': 'CA'
}, {'nm': 'Colorado', 'abbrev': 'CO'}, {
  'nm': 'Connecticut',
  'abbrev': 'CT'
}, {'nm': 'Delaware', 'abbrev': 'DE'}, {
  'nm': 'Florida',
  'abbrev': 'FL'
}, {'nm': 'Georgia', 'abbrev': 'GA'}, {
  'nm': 'Hawaii',
  'abbrev': 'HI'
}, {'nm': 'Idaho', 'abbrev': 'ID'}, {
  'nm': 'Illinois',
  'abbrev': 'IL'
}, {'nm': 'Indiana', 'abbrev': 'IN'}, {
  'nm': 'Iowa',
  'abbrev': 'IA'
}, {'nm': 'Kansas', 'abbrev': 'KS'}, {
  'nm': 'Kentucky',
  'abbrev': 'KY'
}, {'nm': 'Louisiana', 'abbrev': 'LA'}, {
  'nm': 'Maine',
  'abbrev': 'ME'
}, {'nm': 'Maryland', 'abbrev': 'MD'}, {
  'nm': 'Massachusetts',
  'abbrev': 'MA'
}, {'nm': 'Michigan', 'abbrev': 'MI'}, {
  'nm': 'Minnesota',
  'abbrev': 'MN'
}, {'nm': 'Mississippi', 'abbrev': 'MS'}, {
  'nm': 'Missouri',
  'abbrev': 'MO'
}, {'nm': 'Montana', 'abbrev': 'MT'}, {
  'nm': 'Nebraska',
  'abbrev': 'NE'
}, {'nm': 'Nevada', 'abbrev': 'NV'}, {
  'nm': 'New Hampshire',
  'abbrev': 'NH'
}, {'nm': 'New Jersey', 'abbrev': 'NJ'}, {
  'nm': 'New Mexico',
  'abbrev': 'NM'
}, {'nm': 'New York', 'abbrev': 'NY'}, {
  'nm': 'North Carolina',
  'abbrev': 'NC'
}, {'nm': 'North Dakota', 'abbrev': 'ND'}, {
  'nm': 'Ohio',
  'abbrev': 'OH'
}, {'nm': 'Oklahoma', 'abbrev': 'OK'}, {
  'nm': 'Oregon',
  'abbrev': 'OR'
}, {'nm': 'Pennsylvania', 'abbrev': 'PA'}, {
  'nm': 'Rhode Island',
  'abbrev': 'RI'
}, {'nm': 'South Carolina', 'abbrev': 'SC'}, {
  'nm': 'South Dakota',
  'abbrev': 'SD'
}, {'nm': 'Tennessee', 'abbrev': 'TN'}, {
  'nm': 'Texas',
  'abbrev': 'TX'
}, {'nm': 'Utah', 'abbrev': 'UT'}, {
  'nm': 'Vermont',
  'abbrev': 'VT'
}, {'nm': 'Virginia', 'abbrev': 'VA'}, {
  'nm': 'Washington',
  'abbrev': 'WA'
}, {'nm': 'West Virginia', 'abbrev': 'WV'}, {
  'nm': 'Wisconsin',
  'abbrev': 'WI'
}, {'nm': 'Wyoming', 'abbrev': 'WY'}];
