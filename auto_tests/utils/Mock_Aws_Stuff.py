import time

from auto_tests.utils.Mock_Aws_Stuff_exceptions import OperationNotPageableError


# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/apigatewaymanagementapi.html#ApiGatewayManagementApi.Client.get_connection
class Apigatewaymanagementapi:
    def __init__(self, can_paginate: bool = False):
        """
        initializer class

        @param can_paginate: set to false by default | if set to true then get_paginator needs to be implemented
        """
        self.data_dict: dict = dict()
        self.connections: list = list()
        self.__can_paginate: bool = can_paginate

    def post_to_connection(self, **kwargs) -> None:
        """
        simulates post_to_connection method in boto3

        data is stored in a list within a dictionary | connectionId being the key to access the data

        connections are also stored in a separate list without data

        @param kwargs: ConnectionId & Data are needed

        @return: None
        """
        try:
            # append to list if it already exists
            self.data_dict[kwargs["ConnectionId"]].append(kwargs["Data"])
        except Exception as e:
            # if append fails then its first connectionID & list is made with data placed inside it
            self.data_dict[kwargs["ConnectionId"]] = [kwargs["Data"]]
            # on first connection connectionId is put in its own list
            self.connections.append(kwargs["ConnectionId"])

        return None

    def delete_connection(self, **kwargs) -> None:
        """
        simulates the delete_connection method in boto3

        removes connection & data from data_dict
        removes connection from connections list

        @param kwargs: ConnectionId needed

        @return: None
        """
        del self.data_dict[kwargs["ConnectionId"]]
        self.connections.remove(kwargs["ConnectionId"])
        return None

    def can_paginate(self) -> bool:
        """
        simulates the can_paginate method in boto3

        @return: True if it can_paginate | False otherwise
        """
        return self.__can_paginate

    def get_connection(self) -> dict:
        """
        simulates the get_connection method in boto3

        @return: dummy connection data
        """
        return {
            "ConnectedAt": int(time.time()),
            "Identity": {
                "SourceIp": "192.168.0.0",
                "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
            },
            "LastActiveAt": int(time.time() - 60 * 5),
        }

    def get_paginator(self):
        """
        simulates the get_paginator method in boto3

        """
        if not self.can_paginate():
            raise OperationNotPageableError("Unable to Paginate")
        # TODO needs further implementation for if paginate is on

    # TODO implement if needed
    # def get_waiter(self):
    #     return ""
