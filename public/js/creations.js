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
			readEventMap(Number(event.lat), Number(event.lng), "map-modal", event.name, event.location);
		}
	});
});
//Fetching Event Details For Showing In Modal
$('#update-event').on('show.bs.modal', function(event) {
	var eventId = $(event.relatedTarget).closest("div.card").attr('id');
	var form = $(this).find("form#update-event-form");
	database.ref('/events/' + eventId).once('value').then(function(snapshot) {
		if(snapshot.val() == null)
		{
			$("#update-event").modal("hide");
			showAlert("Event does not Exist. <a class='alert-link' href='javascript:window.location.reload()'>Refresh</a> to Remove Event from View");
			return;
		}
		else {
			var event = snapshot.val();
			form.find("#event-id").val(snapshot.key);
			form.find("#name").val(event.name);
			form.find("#description").val(event.description);
			form.find("#time-start").val(new Date(event.timestart));
			form.find("#time-end").val(new Date(event.timeend));
			form.find("#location").val(event.location);
			form.find("#lat").val(event.lat);
			form.find("#lng").val(event.lng);
			createFormMap(Number(event.lat), Number(event.lng), "update-event-map");
		}
	});
});
$('#update-event').on('hidden.bs.modal', function(event) {
	var form = $(this).find("form");
	form.removeClass("was-validated");
	showAlert("An event has been updated. <a class='alert-link' href='javascript:window.location.reload()'>Refresh</a> to let changes display on ypur screen or wait for for the document to refresh itself in 100s.");
	form[0].reset();
});
$('#create-event').on('hidden.bs.modal', function(event) {
	var form = $(this).find("form");
	form.removeClass("was-validated");
	showAlert("An event has been created. <a class='alert-link' href='javascript:window.location.reload()'>Refresh</a> to let changes display on ypur screen or wait for for the document to refresh itself in 100s.");
	form[0].reset();
});
$('#delete-event').on('show.bs.modal', function (event) {
	var button = $(event.relatedTarget); // Button that triggered the modal
	$(this).find('strong').html(button.data('name'));
	$(this).find('.delete-btn').attr("id", button.data('id'));
});
// A Utility Func. for Deleting Events 
function deleteEvent(eventId) {
	database.ref('/events/' + eventId).remove();
	database.ref('/users/' + firebase.auth().currentUser.uid + '/creations/' + eventId).remove();
	showAlert("An event has been deleted. <a class='alert-link' href='javascript:window.location.reload()'>Refresh</a> to let changes display on your screen or wait for for the document to refresh itself in 100s.");
	$("#delete-event").modal("hide");
}
// Applying BS Valididation
(function() {
    window.addEventListener('load', function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                else {
                    event.preventDefault();
                    if(form.id == "create-event-form")
                        createEvent();
                    else if(form.id == "update-event-form")
                    	updateEvent();
                }
                form.classList.add('was-validated');
        }, false);
    });
  }, false);
})();
// A Utility Function for Showing map with Draggable Marker in Modals to set Event Location
function createFormMap(lat, lng, id) {
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
        draggable: true,
        title:"Event Location"
    });
    $(mapCanvas).closest("form").find("input#lat").val(marker.getPosition().lat());
    $(mapCanvas).closest("form").find("input#lng").val(marker.getPosition().lng());
    marker.setMap(map);
    google.maps.event.addListener(marker,'dragend', function() {
        $("#" + id).closest("form").find("input#lat").val(marker.getPosition().lat());
        $("#" + id).closest("form").find("input#lng").val(marker.getPosition().lng());
    });
}
window.onloadend = createFormMap(28.6081, 77.0362, "create-event-map");
//A Utility Func. for Creating Events
function createEvent()
{
    var form = $("#create-event-form");
    var timeStart = new Date(form.find("#time-start").val()).getTime();
    var timeEnd = new Date(form.find("#time-end").val()).getTime();
    var name = form.find("#name").val();
    var description = form.find("#description").val();
    var location = form.find("#location").val();
    var creatorId = firebase.auth().currentUser.uid;
    var eventId = new Date().getTime(); 
    var lat = form.find("#lat").val();
    var lng = form.find("#lng").val(); 
    database.ref('events/' + eventId).set({
        creatorid: creatorId,
        description: description,
        name: name,
        timeend: timeEnd,
        timestart: timeStart,
        location: location,
        lat: lat,
        lng: lng
    }, function(err) {
    	if(err)
    	{
    		//console.log('Failed', err);
    	}
    	else
    	{
    		//console.log('Success');
    	}
    });
    database.ref('/users/' + firebase.auth().currentUser.uid + '/creations/' + eventId).set(eventId);
    $("#create-event").modal("hide");
}
// A Utility Function for Updating Events
function updateEvent()
{
	var form = $("#update-event-form");
    var timeStart = new Date(form.find("#time-start").val()).getTime();
    var timeEnd = new Date(form.find("#time-end").val()).getTime();
    var name = form.find("#name").val();
    var description = form.find("#description").val();
    var location = form.find("#location").val();
    var eventId = form.find("#event-id").val();
    var lat = form.find("#lat").val();
    var lng = form.find("#lng").val(); 
    var eventid = form.find("#event-id").val();
    database.ref('events/' + eventId + '/').update({
        'description': description,
        'name': name,
        'timeend': timeEnd,
        'timestart': timeStart,
        'location': location,
        'lat': lat,
        'lng': lng
    }, function(err) {
    	if(err)
    	{
    		//console.log('Failed', err);
    	}
    	else {
    		//console.log("Success");
    	}
    });
    $("#update-event").modal("hide");
}
window.URL    = window.URL || window.webkitURL;
//Setting Custom Date Time Inputs
$(function () {
    $('.start').datetimepicker();
    $('.end').datetimepicker({
        useCurrent: false //Important! See issue #1075
    });
    $(".start").on("dp.change", function (e) {
    	$(this).closest("form").find('.end').data("DateTimePicker").minDate(e.date);
    });
    $(".time-end").on("dp.change", function (e) {
        $(this).closest("form").find('.start').data("DateTimePicker").maxDate(e.date);
    });
});
$.extend(true, $.fn.datetimepicker.defaults, {
    icons: {
      time: 'far fa-clock',
      date: 'far fa-calendar',
      up: 'fas fa-arrow-up',
      down: 'fas fa-arrow-down',
      previous: 'fas fa-chevron-left',
      next: 'fas fa-chevron-right',
      today: 'fas fa-calendar-check',
      clear: 'far fa-trash-alt',
      close: 'far fa-times-circle'
    }
});
// A Utility Event for Creating Map to see Event Location
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
		//User Signed In
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
			//Fetching Information Of Events ordered By time of Start
			eventsRef.once('value').then(function(snap) {
				var eventList = [];
				snap.forEach(function(eventSnap) {
					var event = eventSnap.val();
					var eventId = eventSnap.key;
					var eventText = "";
					//Showing only Created Events
					if(event.creatorid == user.uid)
					{
						eventList.push({
							name: event.name,
							lat: Number(event.lat),
							lng: Number(event.lng),
							loc: event.location,
							id: "map-" + eventId
						});
						eventText += '<div class="card mb-2" id="' +
						eventId + '"><button type="button" class="float-right close close-btn" data-toggle="modal" data-target="#delete-event" data-name="' +
						event.name + '" data-id="' +
						eventId + '"><span aria-hidden="true">&times;</span></button><div class="card-header h3">' + 
						event.name + '</div><ul class="list-group list-group-flush"><li class="list-group-item"><strong>From</strong>: ' + 
						new Date(event.timestart).toString() +  '</li><li class="list-group-item"><strong>To</strong>: ' +
						new Date(event.timeend).toString() + '</li><li class="list-group-item"><strong>Venue</strong>: ' + 
						event.location + '</li><li class="list-group-item p-0"><div class="map-container" id="map-' +
						eventId + '"></div></liv></ul><div class="card-footer bg-white border-top-0"><button class="btn btn-primary float-left" data-toggle="modal" data-target="#show-event">View</button><button class="btn btn-warning update-btn float-right" data-toggle="modal" data-target="#update-event">Update</button></div></div>';	
						if(event.timeend < curTime)
							pastText += eventText;
						else if(event.timestart > curTime)
							futureText += eventText;
						else
							presentText += eventText;
					}
				});
				pastContainer.innerHTML = pastText;
				presentContainer.innerHTML = presentText;
				futureContainer.innerHTML = futureText;
				for(var i = 0; i < eventList.length; i++)
					readEventMap(eventList[i].lat, eventList[i].lng, eventList[i].id, eventList[i].name, eventList[i].loc);
				if(pastText == "")
					pastContainer.innerHTML = "<p class='lead text-muted mt-2 mb-2 col-12 text-center'>No Created Events Happened</p>";
				if(presentText == "")
					presentContainer.innerHTML = "<p class='lead text-muted mt-2 mb-2 col-12 text-center'>No Created Events Happening Now</p>";
				if(futureText == "")
					futureContainer.innerHTML = "<p class='lead text-muted mt-2 mb-2 col-12 text-center'>No Created Events Scheduled to happen in future</p>";
			});
		}
		setEvents();
		setInterval(setEvents, 100000);
	}
	else {
		window.location.pathname = "/";
	}
});