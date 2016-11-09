/*
	* BasketLathe
	* by mathematicist
	* 2016
	* 
	* shape a basket using mouse as it builds vertically
	* vision: output a .STL file for 3D printing
*/

// GLOBAL VARIABLES
// Dimensions
var spaceDim;		// extent of model space (assumes in mm)
var pixelDim;		// extent of screen space (in pixels)
var pixelToSpace;	// conversion const: pixel * pixeltoSpace = space
var spaceToPixel;	// conversion const: space * spaceToPixel = pixel
// Basket parameters and instance
var setNumVert;		// number of vertives in each path
var setNumPaths;	// number of paths (must be even)
var B;				// instance of Basket object
// Page variables
var blState;
var takingRotInput;
var rotVal;
// Timing variables
var t;				// time marker
var dt;				// time between adding vertices (milliseconds)


// p5 INSTANCE: drawSpace
var drawSpace = function( p ) {
	function setUpGlobalVariables() {
		// Dimensions
		// extent of model space (assumes in mm)
		spaceDim = 150;
		// extent of screen space (in pixels)
		pixelDim = 0.4*( p.windowWidth - 100 );	
		// conversion const: pixel * pixeltoSpace = space
		pixelToSpace = spaceDim / pixelDim;
		// conversion const: space * spaceToPixel = pixel
		spaceToPixel = pixelDim / spaceDim;	
		// Basket parameters and instance
		// number of paths (must be even)
		setNumPaths = 30;
		// number of vertives in each path
		setNumVert = 200;		
		// instance of Basket object	
		B = new Basket( setNumPaths , setNumVert );				
		// Page variables
		blState = 'WAITING';
		takingRotInput = false;
		rotVal = 200;
		// Timing variables
		// time marker
		t = p.millis();		
		// time between adding vertices (milliseconds)	
		dt = 50;
	};
	p.setup = function() {
		setUpGlobalVariables();
		// create and position drawing canvas
		dsCanvas = p.createCanvas( pixelDim , pixelDim );
		dsCanvas.position( 0 , 0 );
		dsCanvas.mousePressed( startRecording );
	};
	p.draw = function() {
		p.background( 156 );
		// draw circles
		p.stroke( 0 );
		p.strokeWeight( 1 );
		p.fill( 255 );
		for( n = 0 ; n < setNumPaths/2 ; n++ ) {
			var angle = 4*p.PI*n / setNumPaths;
			var x = p.mouseX - 0.5*pixelDim;
			var y = p.mouseY - 0.5*pixelDim;
			var x1 = x*p.cos(angle) - y*p.sin(angle);
			var y1 = x*p.sin(angle) + y*p.cos(angle);
			var x2 = -x1;
			var y2 = y1;
			var d = 0.03*pixelDim;
			p.ellipse( x1 + 0.5*pixelDim , y1 + 0.5*pixelDim , d , d );
			p.ellipse( x2 + 0.5*pixelDim , y2 + 0.5*pixelDim , d , d );
		}
		// draw outer circle
		p.stroke( 255 );
		p.strokeWeight( 5 );
		p.noFill();
		p.ellipse( 0.5*pixelDim , 0.5* pixelDim , pixelDim , pixelDim );
		// if waiting, display instructions
		if( blState === 'WAITING' ) {
			p.noStroke();
			p.fill( 64 , 64 , 255 );
			p.textSize( 0.03*pixelDim );
			p.textAlign( p.CENTER , p.TOP );
			p.text( "Click once on this canvas to begin building..." , 0.5*pixelDim , 0.5*pixelDim );
		}
		
		// store vertices in Basket B if recording and dt has elapsed
		if( blState === 'RECORDING' && p.millis() > dt + t ) {
			// reset time maker
			t = p.millis();
			if( !B.addVertPixel( p.mouseX , p.mouseY ) ) {
				blState = 'WAITING';
			}
			//blState = 'WAITING';
		}
	};
	// runs when mousePressed over this instance
	startRecording = function() {
		if( blState === 'WAITING' ) {
			B = new Basket( setNumPaths , setNumVert );	
		}
		blState = 'RECORDING';
		console.log( "recording..." );
	};
	
	// Basket object
	function Basket( numP , numV ) {
		// variables
		this.numPaths = numP;
		this.numVert = numV;
		this.vertCounter = 0;
		this.dz = pixelDim / (this.numVert - 1 );
		// 2D arrays of p5.Vectors
		// this.*Vert[n][v] is vertex (v) of path (n)
		this.pixelVert = new Array( this.numPaths );
		this.spaceVert = new Array( this.numPaths );
		for( n = 0 ; n < this.numPaths ; n++ ){
			this.pixelVert[n] = new Array();
			this.spaceVert[n] = new Array();			
		}
		// method to add a new vertex (pixel input values)
		this.addVertPixel = function( xIn , yIn ) {
			// only add if there is still space
			if( this.vertCounter < this.numVert ) {
				// get coordinates of primary path vertex
				var x = xIn - 0.5*pixelDim;
				var y = yIn - 0.5*pixelDim;
				var z = this.dz * this.vertCounter - 0.5*pixelDim;
				// store vertices of rotated and reflected paths
				for( n = 0 ; n < this.numPaths/2 ; n++ ) {
					var angle = 4*p.PI*n / this.numPaths;
					var vPixel1 = p.createVector( 
						x*p.cos(angle) - y*p.sin(angle) ,
						x*p.sin(angle) + y*p.cos(angle) ,
						z );
					var vPixel2 = p.createVector( -vPixel1.x , vPixel1.y , vPixel1.z );
					var vSpace1 = p5.Vector.mult( vPixel1 , pixelToSpace );
					var vSpace2 = p5.Vector.mult( vPixel2 , pixelToSpace );
					this.pixelVert[2*n].push( vPixel1 );
					this.pixelVert[2*n+1].push( vPixel2 );
					this.spaceVert[2*n].push( vSpace1 );
					this.spaceVert[2*n+1].push( vSpace2 );
				}
				this.vertCounter++;
				return true;
			} else {
				return false;
			}
		}
	};
}
var dS = new p5( drawSpace , 'canvas2' );

var renderSpace = function( p ) {
	p.setup = function() {
		dsCanvas = p.createCanvas( pixelDim , pixelDim , p.WEBGL );
		dsCanvas.position( pixelDim + 10 , 0 );
		dsCanvas.mouseOver( startRotInput );
		dsCanvas.mouseOut( stopRotInput );
		p.background( 220 );
	};
	p.draw = function() {
		p.background( 220 );
		// set viewpoint
		p.translate( 0 , 0 , -0.9*pixelDim );
		if( takingRotInput ) {
			rotVal = -0.5*p.PI + ( p.mouseY - 0.5*pixelDim)  * 0.002;
		}
		p.rotateX( rotVal );
		p.rotateZ( p.millis() * 0.0003 ); 
		p.noFill();
		// render top, bottom squares
		p.beginShape();
		p.vertex( 0.5*pixelDim , 0.5*pixelDim , 0.5*pixelDim );
		p.vertex( 0.5*pixelDim , -0.5*pixelDim , 0.5*pixelDim );
		p.vertex( -0.5*pixelDim , -0.5*pixelDim , 0.5*pixelDim );
		p.vertex( -0.5*pixelDim , 0.5*pixelDim , 0.5*pixelDim );
		p.endShape( p.CLOSE );
		p.beginShape();
		p.vertex( 0.5*pixelDim , 0.5*pixelDim , -0.5*pixelDim );
		p.vertex( 0.5*pixelDim , -0.5*pixelDim , -0.5*pixelDim );
		p.vertex( -0.5*pixelDim , -0.5*pixelDim , -0.5*pixelDim );
		p.vertex( -0.5*pixelDim , 0.5*pixelDim , -0.5*pixelDim );
		p.endShape( p.CLOSE );
		
		// render paths
		for( n = 0 ; n < B.numPaths ; n++ ) {
			p.beginShape();
			for( v = 0 ; v < B.vertCounter ; v++ ) {
				var x = B.pixelVert[n][v].x;
				var y = B.pixelVert[n][v].y;
				var z = B.pixelVert[n][v].z;
				p.vertex( x , y , z );
			}
			p.endShape();
		}

	};
	startRotInput = function() {
		takingRotInput = true;
	};
	stopRotInput = function() {
		takingRotInput = false;
	};
}
var rS = new p5( renderSpace , 'canvas2' );
