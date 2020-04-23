window.addEventListener('load', function() {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener('load', function() {
		if (this.status != 200) return;
		var sheets = JSON.parse(this.responseText).features.map(function(feature) {
			return {
				type: feature['properties']['type'],
				url: feature['properties']['url'],
				state: feature['properties']['state'],
				title: feature['properties']['title'],
				corners: feature['geometry']['coordinates'][0].map(pair => pair.reverse()),
			};
		});
		var states = [], types = ['bundle', '50k', '40k', '25k'];
		var bounds = L.latLngBounds(sheets[0].corners);
		sheets.forEach(sheet => {
			sheet.corners.forEach(point => bounds.extend(point));
			if (states.indexOf(sheet.state) < 0)
				states.push(sheet.state);
		});
		L.mapbox.accessToken = 'pk.eyJ1IjoibWhvbGxpbmciLCJhIjoiY2pncms3d3plMDY3ODJ2bnh0YWdydTBwYyJ9.RdmqeL6b_5m8Q-SzQdbXuQ';
		var layer = L.mapbox.styleLayer('mapbox://styles/mholling/ck9bz5uth02671imzx2s7jujc');
		var map = L.mapbox.map('map').fitBounds(bounds).setMaxBounds(bounds.pad(0.2)).addLayer(layer);
		types.forEach(type => states.forEach(state => map.createPane(type + ',' + state)));
		states = states.filter(state => !state.includes(','));
		types.concat(states).forEach(type => {
			var element = document.createElement('div');
			element.textContent = type;
			element.id = 'show-' + type;
			element.classList.add('selected');
			document.getElementById('toggles').appendChild(element);
			element.addEventListener('click', function() {
				element.classList.toggle('selected');
				Object.keys(map.getPanes()).forEach(key => {
					keys = key.split(',');
					if (!keys.includes(type)) return;
					var selected = keys.every(key => document.getElementById('show-' + key).classList.contains('selected'));
					map.getPane(key).style.display = selected ? 'block' : 'none';
				});
			});
		});
		var toggles = L.control({position: 'topright'});
		toggles.onAdd = map => document.getElementById('toggles');
		toggles.addTo(map);
		var qrcode = L.control({position: 'bottomleft'});
		qrcode.onAdd = map => document.getElementById('qrcode');
		qrcode.addTo(map);
		function toggleAbout() {
			document.getElementById('show-about').classList.toggle('selected');
			document.getElementById('about').classList.toggle('hidden');
		};
		document.getElementById('show-about').addEventListener('click', toggleAbout);
		document.getElementById('close').addEventListener('click', toggleAbout);
		sheets.forEach(sheet => {
			var weight = sheet.type === 'bundle' ? 2 : 1;
			L.polygon(sheet.corners, {
				color: sheet.type === '25k' ? '#FF0000' : sheet.type === '40k' ? '#800080' : sheet.type === '50k' ? '#0000FF' : '#000000',
				weight: weight,
				opacity: 0.8,
				fillOpacity: 0.05,
				pane: sheet.type + ',' + sheet.state,
			}).on('click', function() {
				window.open(sheet.url);
			}).on('mouseover', function() {
				this.setStyle({weight: 4});
				if ('ontouchstart' in document.documentElement) return;
				new QRCode(document.getElementById('qrcode'), {text: sheet.url, width: 128, height: 128});
			}).on('mouseout', function() {
				this.setStyle({weight: weight});
				if ('ontouchstart' in document.documentElement) return;
				document.getElementById('qrcode').innerHTML = null;
			}).bindTooltip(sheet.title, {
				direction: 'top',
				opacity: 0.75,
				sticky: true,
			}).addTo(map);
		});
	});
	xhr.open('GET', 'maps.json');
	xhr.send();
});
