var querystring = require('querystring');
const http = require('http');

export default class TokenChecker {
    config: QConfig;

    constructor(config: QConfig) {
        this.config = config;
    }

    async check_token(token, app_key) {
      return new Promise((resolve, reject) => {
        let post_data = querystring.stringify({
          token: token,
          app_key: app_key,
          service_id: this.config.authorization.this_server_id
        });

        let post_options = {
          hostname: this.config.authorization.server,
          port: this.config.authorization.port,
          path: '/tokens/check_token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data)
          }
        };

        let post_req = http.request(post_options, function(res) {
          res.setEncoding('utf8');
          res.on('data', function (data) {
            let dataObj = JSON.parse(data);
            resolve(dataObj.result === 200);
          });
        });

        post_req.on('error', (err) => {
          resolve(false);
        });

        post_req.write(post_data);
        post_req.end();
      });
    }

}
