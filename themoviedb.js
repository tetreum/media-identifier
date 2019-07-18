const querystring = require('querystring');
const https = require('https');

class TheMovieDB {
    constructor(settings) {
        this.settings = settings;

        this.METHOD_GET = "get";
        this.METHOD_POST = "post";
        this.BASE_URL = 'api.themoviedb.org';
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

    search (q, lang) {
        if (typeof lang === "undefined" || lang == null) {
            lang = this.settings.mainLanguage;
        }

        let filters = {
            'query': q,
            'language': lang
        }

        return new Promise((resolve, reject) => {
            this.query("search/multi", filters, this.METHOD_GET).then((response) => {
                console.log(response);
                if (typeof response.results == "undefined" || response.results.length < 1) {
                    if (lang != this.settings.fallbackLanguage) {
                        this.search(q, this.settings.fallbackLanguage).then(resolve).catch(reject);
                    } else {
                        resolve(response);
                    }
                    return;
                }

                response.results.forEach((media, i) => {
                    response.results[i] = this.standarizeMediaOutput(media);

                    if (i == (response.results.length - 1)) {
                        resolve(response);
                    }
                });
            }).catch(reject);
        });
    }

    /*
    Output between tvshows and movies is different,
    to make it easier we standarize the fields
    */
    standarizeMediaOutput (media) {
        if (typeof media.original_name != "undefined") {
            media.originalName = media.original_name;
        } else if (typeof media.original_title != "undefined") {
            media.originalName = media.original_title;
        }
        if (typeof media.title != "undefined") {
            media.name = media.title;
        }
        if (typeof media.release_date != "undefined") {
            media.year = media.release_date.substr(0, 4);
        } else if (typeof media.first_air_date != "undefined") {
            media.year = media.first_air_date.substr(0, 4);
        }

        media.backdrop_path = "https://image.tmdb.org/t/p/w1280" + media.backdrop_path;
        media.poster_path = "https://image.tmdb.org/t/p/w500" + media.poster_path;

        return media;
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
                    path: "/3/" + route,
                    method: method,
                };

                params.api_key = this.settings.key;

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

            makeQuery();
        });
    }
}

module.exports = TheMovieDB
