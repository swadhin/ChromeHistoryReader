// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Event listner for clicks on links in a browser action popup.
// Open the link in a new tab of the current window.
function onAnchorClick(event) {
  chrome.tabs.create({
    selected: true,
    url: event.srcElement.href
  });
  return false;
}

// Given an array of URLs, build a DOM list of those URLs in the
// browser action popup.
function buildPopupDom(divName, data) {
  var popupDiv = document.getElementById(divName);

  var ul = document.createElement('ul');
  popupDiv.appendChild(ul);

  for (var i = 0, ie = data.length; i < ie; ++i) {
    var a = document.createElement('a');
    a.href = data[i];
    a.appendChild(document.createTextNode(data[i]));
    a.addEventListener('click', onAnchorClick);

    var li = document.createElement('li');
    li.appendChild(a);

    ul.appendChild(li);
  }
}

// Search history to find up to ten links that a user has typed in,
// and show those links in a popup.
function buildTypedUrlList(divName) {
  // To look for history items visited in the last week,
  // subtract a week of microseconds from the current time.
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;

  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;

  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
  //window.requestFileSystem(window.TEMPORARY, 5*1024*1024 /*5MB*/, onInitFs, errorHandler);

  window.requestFileSystem(window.PERSISTENT, 5*1024*1024, function(fs) {
  fs.root.getFile('historyurllog.txt', {create: false}, function(fileEntry) {

    fileEntry.remove(function() {
      console.log('File removed.');
    }, errorHandler);

  }, errorHandler);
}, errorHandler);

  window.webkitStorageInfo.requestQuota(window.PERSISTENT, 5*1024*1024, function(grantedBytes) {
 		 window.requestFileSystem(window.PERSISTENT, grantedBytes, onInitFs, errorHandler);
		}, function(e) {
  		console.log('Error', e);
	});


  var url_all = "MAGIC_FILE" + "\n";

  chrome.history.search({
      'text': '',              // Return every history item....
      'startTime': oneWeekAgo  // that was accessed less than one week ago.
    },
    function(historyItems) {
      // For each history item, get details on all visits.
      for (var i = 0; i < historyItems.length; ++i) {
         var url = historyItems[i].url;
         var lastVisitTime = historyItems[i].lastVisitTime;
	
	url_all = url_all + url + ":" + lastVisitTime + "\n";
	//console.log( url_all + "\n" );
         //console.log(url + ":" + lastVisitTime + "\n");
	window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
	window.requestFileSystem(window.PERSISTENT, 5*1024*1024, function(fs) {
        	fs.root.getFile('historyurllog.txt', {create: false}, function(fileEntry) {
        	// Create a FileWriter object for our FileEntry (log.txt).
        	fileEntry.isFile = true;
        	fileEntry.name = 'historyurllog.txt';
        	fileEntry.fullPath = '/historyurllog.txt';

        	fileEntry.createWriter(function(fileWriter) {
        		
			fileWriter.seek(fileWriter.length); 
			
			fileWriter.onwriteend = function(e) {
                		console.log('Write History completed...'  + e.toString());
                		//console.log(url_all);
        		};

        		fileWriter.onerror = function(e) {
                		console.log('Write History failed: ' + e.toString());
        		};

	
        		// Create a new Blob and write it to log.txt.
        		var blob = new Blob([ url_all ], {type: 'text/plain'});
        		//var blob = new Blob([ url + ":" + lastVisitTime + "\n" ], {type: 'text/plain'});
                	fileWriter.write(blob);

                	}, errorHandler);
                	}, errorHandler);

        	console.log('Write History completed.');
		}, errorHandler);
//Changes made by Sourav
	//function ()
	//{//txtFile.WriteLine(url+":"+lastVisitTime);	
	//}

//changes up to this
        var processVisitsWithUrl = function(url) {
          // We need the url of the visited item to process the visit.
          // Use a closure to bind the  url into the callback's args.
          return function(visitItems) {
            processVisits(url, visitItems);
          };
        };
        chrome.history.getVisits({url: url}, processVisitsWithUrl(url));
        numRequestsOutstanding++;
      }
      //txtFile.Close();
      if (!numRequestsOutstanding) {
        onAllVisitsProcessed();
      }

    });

     //console.log(url_all);

     function onInitFs(fs) {

	console.log("Name : " + fs.root.fullPath);
  	fs.root.getFile('historyurllog.txt', {create: true}, function(fileEntry) {
    	// Create a FileWriter object for our FileEntry (log.txt).
	fileEntry.isFile = true;
        fileEntry.name = 'historyurllog.txt';
        fileEntry.fullPath = '/historyurllog.txt';

    	fileEntry.createWriter(function(fileWriter) {
	
		fileWriter.seek(fileWriter.length);

      		fileWriter.onwriteend = function(e) {
        		console.log('Write completed...'  + e.toString());
      		};

      		fileWriter.onerror = function(e) {
        		console.log('Write failed: ' + e.toString());
      		};

      	// Create a new Blob and write it to log.txt.
      	var blob = new Blob(["MAA" + "\n"], {type: 'text/plain'});
		fileWriter.write(blob);
		}, errorHandler);
  		}, errorHandler);

	console.log('Write completed.');
	}

   function errorHandler(e) {
  	var msg = '';

  	switch (e.code) {
    		case FileError.QUOTA_EXCEEDED_ERR:
      			msg = 'QUOTA_EXCEEDED_ERR';
      			break;
    		case FileError.NOT_FOUND_ERR:
      			msg = 'NOT_FOUND_ERR';
      			break;
    		case FileError.SECURITY_ERR:
      			msg = 'SECURITY_ERR';
      			break;
    		case FileError.INVALID_MODIFICATION_ERR:
      			msg = 'INVALID_MODIFICATION_ERR';
      			break;
    		case FileError.INVALID_STATE_ERR:
      			msg = 'INVALID_STATE_ERR';
      			break;
    		default:
      			msg = 'Unknown Error';
     			 break;
  	};

  	console.log('Error: ' + msg);
	}


  // Maps URLs to a count of the number of times the user typed that URL into
  // the omnibox.
  var urlToCount = {};

  // Callback for chrome.history.getVisits().  Counts the number of
  // times a user visited a URL by typing the address.
  var processVisits = function(url, visitItems) {
    for (var i = 0, ie = visitItems.length; i < ie; ++i) {
      // Ignore items unless the user typed the URL.
     //sourav// if (visitItems[i].transition != 'typed') {
     //sourav//   continue;
     //sourav// }

      if (!urlToCount[url]) {
        urlToCount[url] = 0;
      }

      urlToCount[url]++;
    }

    // If this is the final outstanding call to processVisits(),
    // then we have the final results.  Use them to build the list
    // of URLs to show in the popup.
    if (!--numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
  };

  // This function is called when we have the final list of URls to display.
  var onAllVisitsProcessed = function() {
    // Get the top scorring urls.
    urlArray = [];
    for (var url in urlToCount) {
      urlArray.push(url);
    }

    // Sort the URLs by the number of times the user typed them.
    urlArray.sort(function(a, b) {
      return urlToCount[b] - urlToCount[a];
    });

    buildPopupDom(divName, urlArray.slice(0, 100));
  };
}

document.addEventListener('DOMContentLoaded', function () {
  buildTypedUrlList("typedUrl_div");
  //buildTypedUrlList();
});
