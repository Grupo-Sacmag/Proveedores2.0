const fs = require('fs');
const originalStatus = require('express/lib/response').status;
require('express/lib/response').status = function(code) {
    if (code >= 500) {
        fs.appendFileSync('500_errors.log', new Date().toISOString() + ' - HTTP ' + code + '\n');
    }
    return originalStatus.apply(this, arguments);
};
const originalSend = require('express/lib/response').send;
require('express/lib/response').send = function(body) {
    if (this.statusCode >= 500) {
        fs.appendFileSync('500_errors.log', 'BODY: ' + JSON.stringify(body) + '\n\n');
    }
    return originalSend.apply(this, arguments);
};
