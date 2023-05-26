import json


def get_pulumi_output(pulumi_output_path: str) -> dict:
    """
    reads pulumi output from JSON file on local FS

    @return: dictionary of pulumi outputs
    """
    with open(f"{pulumi_output_path}/pulumi_output.json", "r") as read_file:
        return json.load(read_file)
