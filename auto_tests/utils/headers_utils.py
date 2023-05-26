def get_auth_header_rest_api(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def get_auth_header_ws_api(access_token: str) -> list:
    return [f"Sec-WebSocket-Protocol: auth, {access_token}"]
