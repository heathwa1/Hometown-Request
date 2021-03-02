var map = L.map('map').setView([47.2529, -122.4443], 12);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaC13YXJyZW4iLCJhIjoiY2tpbmV2aHl5MDYxcjJzcGNqaGJzNWwyNSJ9.8Iik9-Klh7z3K-zMi-m_yg', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiaC13YXJyZW4iLCJhIjoiY2tpbmV2aHl5MDYxcjJzcGNqaGJzNWwyNSJ9.8Iik9-Klh7z3K-zMi-m_yg'
}).addTo(map);
  //add empty feature group for drawn items to be placed in
var drawnItems = L.featureGroup().addTo(map);
  //hold data already in carto table
var cartoData = L.layerGroup().addTo(map);
  //create path to add data from carto to map;
  //how to 'read' from carto user site with CARTO SQL API
var url = 'https://heathwa1.carto.com/api/v2/sql';
var urlGeoJSON = url + '?format=GeoJSON&q=';
var sqlQuery = 'SELECT the_geom, wish, specific_type FROM lab_3b_template';
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + feature.properties.wish + "</b><br>" + feature.properties.specific
    );
}
  //get data from carto return in geojson format;
fetch(urlGeoJSON + sqlQuery)
    .then(function(response) {
    return response.json();
    })
  //add popup to imported data and put in L.layerGroup
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(cartoData);
    });

new L.Control.Draw({
    draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: true
    },
    edit: {
        featureGroup: drawnItems
    }
}).addTo(map);



function createFormPopup() {
    var popupContent =
    '<form>'+
      '<li>'+
    		'<b>I wish there was ________ here.</b><br>' +

    			'<input type="radio"  id="retail" name="wish" value="retail">'+
    			'<label for="retail">Retail</label>'+
    			'<input type="radio" id="food" name="wish" value="food">'+
    			'<label for="food">Food</label>'+
    			'<input type="radio" id="school" name="wish" value="school">'+
    			'<label for="school">School</label><br>'+
    			'<input type="radio" id="park" name="wish" value="park">'+
    			'<label for="park">Park</label>'+
    			'<input type="radio" id="housing" name="wish" value="housing">'+
    			'<label for="housing">Housing</label>'+
    			'<input type="radio" id="other" name="wish" value="other">'+
    			'<label for="other">Other</label><br>'+
      '</li>'+
      '<li>'+
    		'<b>Specifically I would like to see...</b>'+
    			'<label for="specific"> (food type, grocery, clothing, walking trails,etc.)</label>'+
    			'<input type="text" id="specific"><br>'+
      '</li>'+
      '<li>'+
          '<b>This area needs this because</b><br>'+
          '<input type= "radio" id="far" name="reason" value="far">'+
          '<label for="far">Others too far</label>'+
          '<input type="radio" id="original" name="reason" value="original">'+
          '<label for="original">Have not seen it</label><br>'+
          '<input type="radio" id="variety" name="reason" value="variety">'+
          '<label for="variety">Need some variety</label>'+
          '<input type="radio" id="price" name="reason" value="price">'+
          '<label for="price">Cost of current options</label><br>'+
      '</li>'+
      '<input type="button" value="Submit" id="submit">'

    	'</form>'


        // <h3>What is there now?</h3>
        //   <input type="radio" id="building" name="current" value="building">
        //   <label for="building">Single Building</label>
        //
        //   <input type="radio" id="complex" name="current" value="complex">
        //   <label for="complex">Business Complex</label>
        //
        //   <input type="radio" id="vacant" name="current" value="vacant">
        //   <label for="vacant">Vacant Land</label>



    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
    });

function setData(e) {
    if(e.target && e.target.id == 'submit') {
      //get name and description from popup form
      var wish = document.getElementsByName('wish');
      var wishValue;
      for (var i = 0; i < wish.length; i++) {
          if(wish[i].checked){
            wishValue = wish[i].value;
          }
      }
      var reason = document.getElementsByName('reason');
      var reasonValue;
      for (var i = 0; i < reason.length; i++) {
          if(reason[i].checked){
            reasonValue = reason[i].value;
          }
      }
console.log(reasonValue)

      var specificWish = document.getElementById("specific").value;
      var wishList = document.getElementsByName("wishValue").value;
console.log(wishValue)
  //send drawn layers data to carto database;

      //for each drawn layer on the site map
    drawnItems.eachLayer(function(layer) {
      //create SQL expression to insert layer;
      var drawing = JSON.stringify(layer.toGeoJSON().geometry);
            var sql =
                "INSERT INTO lab_3b_template (the_geom,wish, specific_type) " +
                "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                drawing + "'), 4326), '" +
                wishValue + "', '" +
                specificWish + "')";
            console.log(sql);

      //send data to carto with CARTO SQL API
          fetch(url, {
              method: "POST",
              headers: {
                  "Content_Type": "application/x-www-form-urlencoded"
              },
              body: "q=" + encodeURI(sql)
          })
          .then(function(response) {
              return response.json();
          })
          .then(function(data) {
              console.log("Data saved:", data);
          })
          .catch(function(error) {
              console.log("Problem saving the data:", error);
          });

      //Transfer user submitted drawing to carto layer(cartoData)
      //so it stays on map without needing to refresh page

        var newData = layer.toGeoJSON();
        newData.properties.wishValue[i] = wishList;
        newData.properties.specific = specificWish;
        L.geoJSON(newData, {onEachFeature: addPopup}).addTo(cartoData);
      });
      //clear layers
      drawnItems.closePopup();
      drawnItems.clearLayers();

    }
}
  document.addEventListener('click', setData);

  map.addEventListener('draw:editstart', function(e) {
      drawnItems.closePopup();
  });
  map.addEventListener('draw:deletestart', function(e) {
      drawnItems.closePopup();
  });
  map.addEventListener('draw:editstop', function(e) {
      drawnItems.openPopup();
  });
  map.addEventListener('draw:deletestop', function(e) {
      if(drawnItems.getLayers().length > 0) {
          drawnItems.openPopup();
      }
  });
//adapted from example from W3Schools
  //get the modal element
  var modal = document.getElementById("myModal");
  //get the button that opens the modal
  var btn = document.getElementById("myBtn");
  //get the <span> element that closes the modal
  var span =document.getElementsByClassName("close")[0];
  //create function that opens the modal when button clicked
    btn.onclick = function() {
        modal.style.display = "block";
    }
    //close modal when clicked
    span.onclick = function() {
        modal.style.display = "none";
    }
    //close window when clicked outside modal
    window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = "none";
    }
  }
