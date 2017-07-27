var express = require('express');
var cheerio = require('cheerio');
var request = require('request');
var requestretry = require('requestretry');
var router = express.Router();

/* GET chapter listing. */
router.get('/', function(req, res) {
	var rootUrl = 'http://www.mangareader.net';
	var chapterUrl = req.query.c;

	if (chapterUrl) {
        var pages = [];

	    //request(chapterUrl, function(err, resp, body) {
	    requestretry({url: chapterUrl, maxAttempts: 10, retryDelay: 5000}, function(err, resp, body) {
	        if (err) {
	            //throw err;
	            console.log(err);
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
