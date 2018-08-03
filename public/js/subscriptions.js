// Function for Subscribing Events
function subscribeEvent(eventId) {
	var userId = firebase.auth().currentUser.uid;
	var subscribeBtn = $("#show-event").find(".subscribe-btn");
	database.ref('/events/' + eventId + '/subscribers/' + userId).once('value').then(function (snapshot) {
		if(snapshot.val() == null)
		{
			database.ref('/events/' + eventId + '/subscribers/' + userId).set(userId);
			database.ref('/users/' + userId + '/subscriptions/' + eventId).set(eventId);
			subscribeBtn.addClass("btn-danger");
			subscribeBtn.removeClass("btn-primary");
			subscribeBtn.html("Unsubscribe");
		}
		else 
		{
			database.ref('/events/' + eventId + '/subscribers/' + userId).remove();
			database.ref('/users/' + userId + '/subscriptions/' + eventId).remove();
			subscribeBtn.removeClass("btn-danger");
			subscribeBtn.addClass("btn-primary");
			subscribeBtn.html("Subscribe");
		}
	});
}
// Setting Event Details to Show in Modal
$('#show-event').on('show.bs.modal', function(event) {
	var eventId = $(event.relatedTarget).closest("div.card").attr('id');
	var userId = firebase.auth().currentUser.uid;
	var container = $(this).find(".card");
	database.ref('/events/' + eventId).once('value').then(function(snapshot) {
		if(snapshot.val() == null)
		{
			$("#show-event").modal("hide");
			showAlert("Event does not Exist. <a class='alert-link' href='javascript:window.location.reload()'>Refresh</a> to Remove Event from View");
			return;
		}
		else {
			var event = snapshot.val();
			var subscribeBtn = $("#show-event").find(".subscribe-btn");
			subscribeBtn.attr("id", snapshot.key);
			container.find("#name").html(event.name);
			container.find("#description").html(event.description);
			container.find("#from").html("<strong>From: </strong>" + new Date(event.timestart));
			container.find("#to").html("<strong>To: </strong>" + new Date(event.timeend));
			container.find("#venue").html("<strong>Venue: </strong>"  + event.location);
			if(event.subscribers)
			{
				if(userId in event.subscribers)
				{
					//User is Subscribed
					subscribeBtn.addClass("btn-danger");
					subscribeBtn.removeClass("btn-primary");
					subscribeBtn.html("Unsubscribe");
				}
				else
				{
					//User is Unsubscribed
					subscribeBtn.addClass("btn-primary");
					subscribeBtn.removeClass("btn-danger");
					subscribeBtn.html("Subscribe");
				}
			}
			else 
			{
				//User is Unsubscribed
				subscribeBtn.addClass("btn-primary");
				subscribeBtn.removeClass("btn-danger");
				subscribeBtn.html("Subscribe");
			}
			//Showing Map in Modal
			readEventMap(Number(event.lat), Number(event.lng), "map-modal", event.name, event.location);
		}
	});
});
// A Utility Function for Showing map in Modals to show Event Location
function readEventMap(lat, lng, id, name, location) {
    var center = new google.maps.LatLng(lat, lng);
    var mapCanvas = document.getElementById(id);
    var mapOptions = {
        center: center,
        zoom: 16
    };
    var map = new google.maps.Map(mapCanvas, mapOptions);
    var marker = new google.maps.Marker({
        position: center,
        map: map,
        draggable: false,
        title:"Event Location"
    });
    var content = "<div><h6>" + 
	name + "</h6><strong>Venue: </strong><a target='_blank' href='https://www.google.com/maps/search/?api=1&query=" + 
	lat + "," + 
	lng + "'>" + 
	location + "</a></div>";
    var infoWindow = new google.maps.InfoWindow({
		content: content
    });  	
    marker.setMap(map);
    google.maps.event.addListener(marker, 'click', function() {
		infoWindow.open(map, marker);	
  	});
}
firebase.auth().onAuthStateChanged(function(user) {
	if(user)
	{
		//User is Signed in
		//Fetching Information Of Subscribed Events ordered By time of Start
		var eventsRef = database.ref('/events').orderByChild('timestart');
		function setEvents() {
			var pastContainer = document.getElementById("past");
			var presentContainer = document.getElementById("present");
			var futureContainer = document.getElementById("future");
			var pastText = "";
			var presentText = "";
			var futureText = "";
			var countEvents = 0;
			var curTime = new Date().getTime();
			eventsRef.once('value').then(function(snap) {
				var eventList = [];
				snap.forEach(function(eventSnap) {
					var event = eventSnap.val();
					var eventId = eventSnap.key;
					var eventText = "";
					if(event.subscribers)
					{
						if(user.uid in event.subscribers)
						{
							eventList.push({
								name: event.name,
								lat: Number(event.lat),
								lng: Number(event.lng),
								loc: event.location,
								id: "map-" + eventId
							});
							eventText += '<div class="card mb-2" id="' +
							eventId + '"><div class="card-header h3">' + 
							event.name + '</div><ul class="list-group list-group-flush"><li class="list-group-item"><strong>From</strong>: ' + 
							new Date(event.timestart).toString() +  '</li><li class="list-group-item"><strong>To</strong>: ' +
							new Date(event.timeend).toString() + '</li><li class="list-group-item"><strong>Venue</strong>: ' + 
							event.location + '</li><li class="list-group-item p-0"><div class="map-container" id="map-' +
							eventId + '"></div></liv></ul><div class="card-footer bg-white border-top-0"><button class="btn btn-primary float-right" data-toggle="modal" data-target="#show-event">View Details</button></div></div>';	
							if(event.timeend < curTime)
								pastText += eventText;
							else if(event.timestart > curTime)
								futureText += eventText;
							else
								presentText += eventText;
						}
					}
				});
				pastContainer.innerHTML = pastText;
				presentContainer.innerHTML = presentText;
				futureContainer.innerHTML = futureText;
				for(var i = 0; i < eventList.length; i++)
					readEventMap(eventList[i].lat, eventList[i].lng, eventList[i].id, eventList[i].name, eventList[i].loc);
				if(pastText == "")
					pastContainer.innerHTML = "<p class='lead text-muted mt-4 mb-4 col-12 text-center'>No Subscribed Events Happened</p>";
				if(presentText == "")
					presentContainer.innerHTML = "<p class='lead text-muted mt-4 mb-4 col-12 text-center'>No Subscribed Events Happening Now</p>";
				if(futureText == "")
					futureContainer.innerHTML = "<p class='lead text-muted mt-4 mb-4 col-12 text-center'>No Subscribed Events Scheduled to happen in future</p>";
			});
		}
		setEvents();
		setInterval(setEvents, 100000);
	}
	else {
		window.location.pathname = "/";
	}
});