const querystring = require('querystring');
const https = require('https');

class Tviso {
    constructor(id, secret) {
        this.id = id;
        this.secret = secret;

        this.METHOD_GET = "get";
        this.METHOD_POST = "post";
        this.BASE_URL = 'api.tviso.com';
    }

    getAuthToken (force = false) {
        return new Promise((resolve, reject) => {
            if (typeof this.authToken === "undefined" || force) {
                this.query("auth_token", {
                    'id_api': this.id,
                    'secret': this.secret,
                }, this.METHOD_POST).then((response) => {
                    this.authToken = response.auth_token;

                    resolve(this.authToken);
                });
            } else {
                resolve(this.authToken);
            }
        });
    }

    setUserToken (userToken) {
        this.userToken = userToken;
    }

    getUserToken (username, password) {
        return this.query("user/user_token", {
            'username': username,
            'password': password,
        }, this.METHOD_POST);
    }

    getMedia (idm, mediaType, fullInfo) {
        if (typeof fullInfo === "undefined" || fullInfo == null || fullInfo == false) {
            fullInfo = "basic";
        } else {
            fullInfo = "full";
        }

        return this.query("media/" + fullInfo + "_info", {
            'idm': idm,
            'mediaType': mediaType,
        }, this.METHOD_GET);
    }

    search (q, mediaType) {
        let filters = {
            'q': q
        }

        if (typeof mediaType !== "undefined" && mediaType !== null) {
            filters.mediaType = mediaType;
        }

        return this.query("media/search", filters, this.METHOD_GET);
    }

    query (route, params, method) {
        if (typeof params === "undefined" || params == null) {
            params = {};
        }
        if (typeof method === "undefined" || method == null) {
            method = this.METHOD_GET;
        }

        return new Promise((resolve, reject) => {

            var makeQuery = (authToken) => {

                let requestData = {
                    protocol: "https:",
                    host: this.BASE_URL,
                    port: 443,
                    path: "/v2/" + route,
                    method: method,
                };

                if (typeof authToken !== "undefined" && authToken != null) {
                    params.auth_token = authToken;
                }
                if (typeof this.userToken !== "undefined" && this.userToken != null) {
                    params.user_token = this.userToken;
                }

                var paramList;

                if (method === this.METHOD_GET) {
                    requestData.path = requestData.path + "?" + querystring.stringify(params);
                } else {
                    paramList = querystring.stringify(params);
                    requestData.headers = {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(paramList)
                    }
                }

                let request = https.request(requestData, (res) => {
                    let response = "";

                    res.setEncoding('utf8');

                    res.on('data', (chunk) => {
                        response += chunk;
                    });
                    res.on('end', () => {
                        try {
							response = JSON.parse(response);

							// invalid authToken
							if (response.error === 1) {
								this.getAuthToken(true).then(makeQuery);
							} else {
								resolve(response);
							}
                        } catch (e) {
							console.error("Tviso request error", e.message);
                            reject(response);
                        }
                    });
                })

                if (method === "post") {
                    request.write(paramList);
                }

                request.on('error', (e) => {
                  console.log("Tviso API error: " + e.message);
                });

                request.end();
            }

            if (route === "auth_token") {
                makeQuery();
            } else {
                this.getAuthToken().then(makeQuery);
            }
        });
    }
}

module.exports = Tviso
