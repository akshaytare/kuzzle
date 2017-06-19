const async = require('async');

function apiSteps () {
  this.Then(/^I should receive a ?(.*?) notification with field ?(.*?) equal to "([^"]*)"$/, function (type, field, value, callback) {
    const main = callbackAsync => {
      setTimeout(() => {
        if (this.api.responses) {
          if (this.api.responses.error) {
            callbackAsync('An error occurred ' + this.api.response.error.toString());
            return false;
          }

          if (this.api.responses.type !== type) {
            callbackAsync(`Wrong notification type received: ${this.api.responses.type}. Expected: ${type}`);
            return false;
          }

          if (this.api.responses[field] !== value) {
            callbackAsync(`Expected notification field "${field}" to be equal to "${value}", but got "${this.api.responses[field]}" instead.`);
          }

          callbackAsync();
        } else {
          callbackAsync('No notification received');
        }
      }, 20);
    };

    async.retry(20, main, err => {
      if (err) {
        if (err.message) {
          err = err.message;
        }

        return callback(new Error(err));
      }

      callback();
    });
  });

  this.Then(/^The notification should ?(not)* have a "([^"]*)" member/, function (not, member, callback) {
    if ((this.api.responses.result[member] || not) && !(this.api.responses.result[member] && not)) {
      callback();
    }
    else {
      console.log('Notification received:');
      console.dir(this.api.responses.result[member], {colors: true, depth: null});
      callback('The document was ' + (not ? 'not ' : '') + 'supposed to contain the member "' + member + '"');
    }
  });

  this.Then(/^The notification should have volatile/, function (callback) {
    if (!this.api.responses.volatile) {
      return callback('Expected volatile in the notification but none was found');
    }

    let diff = Object.keys(this.volatile).length !== Object.keys(this.api.responses.volatile).length;

    Object.keys(this.volatile).forEach(key => {
      if (!diff) {
        if (!this.api.responses.volatile[key]) {
          diff = true;
        } else {
          diff = JSON.stringify(this.volatile[key]).localeCompare(JSON.stringify(this.api.responses.volatile[key])) !== 0;
        }
      }
    });

    if (diff) {
      callback('Expected ' + JSON.stringify(this.api.responses.volatile) + ' to match ' + JSON.stringify(this.volatile));
    } else {
      callback();
    }

  });
}

module.exports = apiSteps;
