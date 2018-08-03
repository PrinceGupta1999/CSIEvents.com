//Smooth Scrolling
// Add scrollspy to <body>
$('body').scrollspy({target: ".navbar", offset: 50});
// Add smooth scrolling on all links inside the navbar
$("#myNavbar a").on('click', function(event) {
  // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") {
        // Prevent default anchor click behavior
        event.preventDefault();
        // Store hash
        var hash = this.hash;
        // Using jQuery's animate() method to add smooth page scroll
        // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
        $('html, body').animate({
          scrollTop: $(hash).offset().top
        }, 400, function(){
        // Add hash (#) to URL when done scrolling (default click behavior)
          window.location.hash = hash;
        });
    } // End if
});
$('.nav-link, .navbar-brand').click(function() {
    var sectionTo = $(this).attr('href');
    $('html, body').animate({
      scrollTop: $(sectionTo).offset().top
    }, 1500);
});
function showAlert(message) {
    // A utility function to show custom BS alerts.
    var alertBox = $("#alert-box");
    alertBox.html('<div class="alert alert-warning alert-dismissible border-0 m-0">' + message + '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span></button></div>'); 
}
function notify(message) {
    // A utility function to show Notification notifications on mobiles when site is in foreground
    var alertBox = $("#alert-box");
    alertBox.html('<div class="alert alert-info alert-dismissible border-0 m-0">' + message + '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span></button></div>');     
}
// Firebase Initialisation
var config = {
    apiKey: "AIzaSyBrqW0AoHqAB8Ent1qbrSUVVPgUyP411hE",
    authDomain: "csiproject-ab88a.firebaseapp.com",
    databaseURL: "https://csiproject-ab88a.firebaseio.com",
    projectId: "csiproject-ab88a",
    storageBucket: "csiproject-ab88a.appspot.com",
    messagingSenderId: "758738642724"
};
firebase.initializeApp(config);
const database = firebase.database();
//Initialisations for Push Notification
const messaging = firebase.messaging();
messaging.usePublicVapidKey("BMNrUn4D4Cm8L2hOIvJf1cDxHrblVQmdokzovcT33uBrNL92Hqq-uKW5NKXAvdn7E6pAKmZJL2WYya2oQirTkJc");
//Authentication
function toggleSignIn() {
  	if (!firebase.auth().currentUser) {
        //Display Overlay
            var overlay = $("#overlay");
        if(overlay) {
            overlay.removeClass("d-none");
            overlay.addClass("d-flex");           
        }
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
    	    prompt: 'select_account'
  	    });
        provider.addScope('https://www.googleapis.com/auth/plus.login');
        firebase.auth().signInWithRedirect(provider);
    }
    else {
        firebase.auth().signOut();
    }
}
function initApp() {
    //console.log("started initApp");
    firebase.auth().getRedirectResult().then(function(result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // [START_EXCLUDE]
        } 
        else {
        
        }
        // The signed-in user info.
        var user = result.user;
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // [START_EXCLUDE]
        if (errorCode === 'auth/account-exists-with-different-credential') {
            showAlert('You have already signed up with a different auth provider for that email.');
            // If you are using multiple auth providers on your app you should handle linking
            // the user's accounts here.
        } else {
            //console.error(error);
        }
        // [END_EXCLUDE]
    });
    // [END getidptoken]
    // Listening for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function(user) {
        if(user) {
            //Display Overlay
            var overlay = $("#overlay");
            if(overlay)
            {
                overlay.removeClass("d-none");
                overlay.addClass("d-flex");            
            }
            // User is signed in.
            // Enter Into Database
            document.getElementById("login-btn").innerHTML = "Sign Out";
            var userId = user.uid;
            //Requesting Permission for Showing Notification
            messaging.requestPermission().then(function() {
                console.log('Notification permission granted.');
                messaging.getToken().then(function(token) {
                    if(token)
                    {
                        console.log(token);
                        database.ref('/fcm/' + userId).set(token);
                    }
                }).catch(function(err) {
                    console.log(err);
                    showAlert('An error occurred while retrieving token.');
                });
            }).catch(function(err) {
                showAlert('Unable to get permission to notify.');
                console.log(err);
            });
            messaging.onTokenRefresh(function() {
                messaging.getToken().then(function(token) {
                    if(token)
                    {
                        console.log(token);
                        database.ref('/fcm/').set({[userId] : token});
                    }
                }).catch(function(err) {
                    showAlert('Unable to retrieve refreshed token');
                    console.log(err);
                });
            });
            messaging.onMessage(function(payload) {
                var notificationTitle = payload.notification.title;
                var notificationOptions = {
                    body: payload.notification.body,
                    icon: payload.notification.icon,        
                };

                if (!("Notification" in window)) {
                    notify("<span class='font-weight-bold'>" + notificationTitle + ":</span>" + notificationOptions.body);
                }
                // Let's check whether notification permissions have already been granted
                else if (Notification.permission === "granted") {
                    // If it's okay let's create a notification
                    var notification = new Notification(notificationTitle,notificationOptions);
                    notification.onclick = function(event) {
                        event.preventDefault(); // prevent the browser from focusing the Notification's tab
                        window.open(payload.notification.click_action , '_blank');
                        notification.close();
                    }
                }
            });
            database.ref('/users/' + userId).once('value').then(function(snapshot) {
    		  	if(snapshot.val() === null)	{
                    // New User Enter into Database
                    database.ref('/users/' + userId).set({
                        name: user.displayName,
                        email: user.email,
                        imageurl: user.photoURL
                    });
		  	    }
                if(window.location.pathname == "/")
                    window.location.href = '/discover.html';
		    });                     
        } 
        else {
            // User is signed out. Sign to Homepage
            if(window.location.pathname != "/")
                window.location.href = '/';
        }
    });
    document.getElementById('login-btn').addEventListener('click', toggleSignIn, false);
    //console.log("end initApp");
}
window.onload = function() {
    initApp();
}