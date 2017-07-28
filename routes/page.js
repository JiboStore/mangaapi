var express = require('express');
var cheerio = require('cheerio');
var request = require('request');
var requestretry = require('requestretry');
var httpstatus = require('http-status-codes');
var router = express.Router();

var maxattempts = 30;

function myDelayStrategy(err, response, body) {
	// set delay of retry to a random number between 500 and 3500 ms
	return Math.floor(Math.random() * (3500-500+1) + 500);
}

/* GET page listing. */
router.get('/', function(req, res) {
	var rootUrl = 'http://www.mangareader.net';
	var pageUrl = req.query.p;

	if (pageUrl) {
	    //request(pageUrl, function(err, resp, body) {
	    requestretry({url: pageUrl, maxAttempts: maxattempts, delayStrategy: myDelayStrategy}, function(err, resp, body) {
	        if (err) {
	            //throw err;
	            console.log(err);
	            if ( resp ) {
	            	if ( resp.attempts >= (maxattempts-1)) ) {
	            		res.status(httpstatus.GATEWAY_TIMEOUT).send("please retry");
	            	}
	            }
	        }

	        $ = cheerio.load(body);

			var page = {};

	        $('#imgholder').each(function(result) {
				$(this).find('img').each(function() {
					var imageWidth = null;
					var imageHeight = null;
					var imageSource = null;
					var imageAlt = null;

					imageWidth = $(this).attr('width');
					imageHeight = $(this).attr('height');
					imageSource = $(this).attr('src');
					imageAlt = $(this).attr('alt');

					page = {
	                    "imageWidth": imageWidth,
	                    "imageHeight" : imageHeight,
	                    "imageSource" : imageSource,
	                    "imageAlt" : imageAlt
	                };
    			});
	        });

	        var pageResults = {
	        	"pageUrl" : pageUrl,
	        	"pageImage" : page
	        };

	        res.send(JSON.stringify(pageResults));
	    });		
	} else {
		res.send('no searchTerm');
	}
});

module.exports = router;
