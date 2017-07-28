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

/* GET search results listing. */
router.get('/', function(req, res) {
	var rootUrl = 'http://www.mangareader.net';
	var itemsPerPage = 30;
	var searchTerm = req.query.t;

	if (searchTerm) {
		var url = rootUrl + '/search/?w=' + searchTerm;
		var searchUrl = url;

        var results = [];

	    //request(url, function(err, resp, body) {
	    requestretry({url: searchUrl, maxAttempts: maxattempts, delayStrategy: myDelayStrategy}, function(err, resp, body) {
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

	        $('#mangaresults .mangaresultitem .mangaresultinner').each(function(result) {
				var resultName = null;
				var resultUrl = null;
				var resultFullUrl = null;
				var thumb = null;
				var chapters = null;
				var type = null;
				var genre = null;

				$(this).find('a').each(function() {
					resultName = $(this).text();
					resultUrl = $(this).attr('href');
					resultFullUrl = rootUrl + resultUrl;
    			});

				$(this).find('.imgsearchresults').each(function() {
					thumb = $(this).css('background-image');
					thumb = thumb.replace('url(\'','').replace('\')','');
    			});

    			$(this).find('.chapter_count').each(function() {
    				chapters = $(this).text();
    			});

    			$(this).find('.manga_type').each(function() {
    				type = $(this).text();
    			});

    			$(this).find('.manga_genre').each(function() {
    				genre = $(this).text();
    			});

				var result = {
                    "resultName": resultName,
                    "resultUrl": resultUrl,
                    "resultFullUrl" : resultFullUrl,
                    "resultThumbImageUrl" : thumb,
                    "resultChapters" : chapters,
                    "resultType" : type,
                    "resultGenre" : genre
                };

                results.push(result);
	        });

			var pages = 0;

	        $('#sp').each(function(result) {
				$(this).find('a').each(function() {
					var pageUrl = $(this).attr('href');

					if (pageUrl) {
						console.log(pageUrl);
					}
					// console.log($(this).text());
					pages = pageUrl;
				});
			});

	        if (results.length < itemsPerPage) {
	        	pages = (results.length == 0 ? 0 : 1);
	        } else {
	        	pages = (pages / itemsPerPage) + 1;
	        }

	        var searchResults = {
	        	"searchTerm" : searchTerm,
	        	"resultCount" : results.length,
	        	"resultPageCount" : pages,
	        	"results": results
	        };

	        res.send(JSON.stringify(searchResults));
	    });		
	} else {
		res.send('no searchTerm');
	}
});

module.exports = router;
