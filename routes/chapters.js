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

/* GET chapter listing. */
router.get('/', function(req, res) {
	var rootUrl = 'http://www.mangareader.net';
	var chapterUrl = req.query.c;

	if (chapterUrl) {
        var pages = [];

	    //request(chapterUrl, function(err, resp, body) {
	    requestretry({url: chapterUrl, maxAttempts: maxattempts, delayStrategy: myDelayStrategy}, function(err, resp, body) {
	        if (err) {
	            //throw err;
	            console.log(err);
	            if ( resp ) {
	            	if ( resp.attempts >= (maxattempts-1) ) {
	            		res.status(httpstatus.GATEWAY_TIMEOUT).send("please retry");
	            	}
	            }
	        }

	        $ = cheerio.load(body);

	        $('#pageMenu option').each(function(result) {
	        	var pageNumber = null;
	        	var pageUrl = null;
	        	var pageFullUrl = null;

	        	pageUrl = $(this).attr('value');
	        	pageFullUrl = rootUrl + pageUrl;
	        	pageNumber = $(this).text();

				var page = {
                    "pageNumber": pageNumber,
                    "pageUrl" : pageUrl,
                    "pageFullUrl" : pageFullUrl
                };

                pages.push(page);
	        });

	        var pageResults = {
	        	"chapterUrl" : chapterUrl,
	        	"pageCount" : pages.length,
	        	"pages": pages
	        };

	        res.send(JSON.stringify(pageResults));
	    });		
	} else {
		res.send('no searchTerm');
	}
});

module.exports = router;
