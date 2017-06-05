//var rp = require("request-promise");

module.exports = NetatmoHelper;

function NetatmoHelper() {
    return new Netatmo();
};

function Netatmo() {
    this.getOutdoorTemp = function getOutdoorTemp(location) {
        switch (location) {
        case "Winterthur":
            return "20.0";
        case "Klosters":
            return "10.0";
        default:
            return "undefined";
        }
    }

    /* this.getQnAResponsePromise = function getQnAResponsePromise(question) {
         if (!process.env.MICROSOFT_QNA_MAKER_URL) {
             throw new Error("MICROSOFT_QNA_MAKER_URL is not defined as env variable");
         }
         if (!process.env.MICROSOFT_QNA_MAKER_KEY) {
             throw new Error("MICROSOFT_QNA_MAKER_KEY is not defined as env variable. Please the Ocp-Apim-Subscription-Key from https://qnamaker.ai/Home/MyServices / View code");
         }
         var options = {
             method: 'POST',
             uri: process.env.MICROSOFT_QNA_MAKER_URL,
             headers: {
                 'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_QNA_MAKER_KEY,
                 'Content-Type': 'application/json'
             },
             body: {
                 question: question
             },
             json: true // Automatically stringifies the body to JSON 
         };
         return rp(options);
     }

     this.getQnAResponse = function getQnAResponse(question, cb) {
         this.getQnAResponsePromise(question).then(value => {
             cb(question, value);
         });
     };*/
}