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
var gapPixels;
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
// text vor version number
var versionText;
// 3D printing variables
var maxAngle;			// max angle of path
var fileSTL;			// array of strings
var basketComplete;		// is the basket complete?
var radialWidth;
var tangentWidth;
var baseHeight;			// heights of base/top
var topHeight;
// cursor controls
var cPos;				// position of cursor (p5.Vector) relative to center
var maxCursorRadius;  	// max cursor distance from center
var minCursorRadius;  	// min cursor distance from center
var maxCursorTravel;	// max distance the cursor can travel each vertex


// p5 INSTANCE: drawSpace
var drawSpace = function( p ) {
	function setUpGlobalVariables() {
		// Dimensions
		// extent of model space (assumes in mm)
		spaceDim = 100;
		// extent of screen space (in pixels)
		gapPixels = 10;
		if( p.windowWidth > p.windowHeight ) {
			pixelDim = p.windowHeight;
			if( gapPixels + 2*pixelDim > p.windowWidth ) {
				pixelDim = 0.5*( p.windowWidth - gapPixels );
			}
		} else {
			pixelDim = p.windowWidth;
			if( gapPixels + 2*pixelDim > p.windowHeight ) {
				pixelDim = 0.5*( p.windowHeight - gapPixels );
			}
		}
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
		rotVal = -0.5*p.PI ;
		// Timing variables
		// time marker
		t = p.millis();		
		// time between adding vertices (milliseconds)	
		dt = 50;
		// version text
		versionText = '0.13';
		// 3D printing variables
		// max angle of path
		maxAngle = p.PI/180 * 40;
		// array of strings, each a line in .STL file
		fileSTL = new Array();
		// has a basket been completed?
		basketComplete = false;
		// width of path (radial)
		radialWidth = 4;
		// width of path (tangent)
		tangentWidth = 4;
		// heights of base/top
		baseHeight = 5;
		topHeight = 5;
		// cursor controls
		// position of cursor (p5.Vector) relative to center
		cPos = p.createVector( p.mouseX , p.mouseY );		
		// max cursor distance from center
		maxCursorRadius = 0.5*pixelDim;
		// min cursor distance from center
		minCursorRadius = 0.5*pixelDim*0.2;
		// max distance the cursor can travel each vertex
		maxCursorTravel = ( pixelDim/(setNumVert-1) ) / p.tan(maxAngle);	
	};
	p.setup = function() {
		setUpGlobalVariables();
		// create and position drawing canvas
		dsCanvas = p.createCanvas( pixelDim , pixelDim );
		if( p.windowWidth > p.windowHeight ) {
			dsCanvas.position( 0 , 0 );
		} else {
			dsCanvas.position( 0 , pixelDim + gapPixels );
		}
		dsCanvas.mousePressed( startRecording );
		dsCanvas.mouseOut( stopRotInput );
	};
	p.draw = function() {
		
		// if waiting
		if( blState === 'WAITING' ) {
			// update the cursor position
			var mPos = p.createVector( p.mouseX - 0.5*pixelDim , p.mouseY - 0.5*pixelDim );
			cPos = p.createVector(mPos.x , mPos.y );
			if( cPos.mag() > maxCursorRadius ) {
				cPos.normalize().mult( maxCursorRadius );
			}
			if( cPos.mag() < minCursorRadius ) {
				cPos.normalize().mult( minCursorRadius );
			}
			
			// display the canvas and cursors
			drawCanvas();
			// display instruction text
			p.noStroke();
			p.fill( 28 , 56 , 128 );
			p.stroke( 0 );
			p.textAlign( p.CENTER , p.TOP );
			p.textSize( 0.04*pixelDim );
			p.text( "BASKET LATHE\n-mathematicist-", 0.5*pixelDim , 0.35*pixelDim );
			p.textSize( 0.03*pixelDim );
			p.text( "Click once on this canvas to begin building...\nv" + versionText , 0.5*pixelDim , 0.55*pixelDim );
			if( basketComplete ) {
				p.text( "type 'g' to generate a .STL file for 3D printing.." , 0.5*pixelDim , 0.75*pixelDim );
			}
		}
		
		// store vertices in Basket B if recording and dt has elapsed
		if( blState === 'RECORDING' && p.millis() > dt + t ) {
			// update the cursor position
			var mPos = p.createVector( p.mouseX - 0.5*pixelDim , p.mouseY - 0.5*pixelDim );
			var cursorToMouse = p5.Vector.sub( mPos , cPos );
			if( cursorToMouse.mag() > maxCursorTravel ) {
				cursorToMouse.normalize().mult( maxCursorTravel );
				cPos.add( cursorToMouse );
			} else {
				cPos = p.createVector(mPos.x , mPos.y );
			}
			if( cPos.mag() > maxCursorRadius ) {
				cPos.normalize().mult( maxCursorRadius );
			}
			if( cPos.mag() < minCursorRadius ) {
				cPos.normalize().mult( minCursorRadius );
			}
			// draw the canvas and cursors
			drawCanvas();
			// reset time maker
			t = p.millis();
			if( !B.addVert( cPos ) ) {
				blState = 'WAITING';
				basketComplete = true;
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
	stopRotInput = function() {
		takingRotInput = false;
	};
	
		
	// function to draw canvas and circles
	function drawCanvas() {
		p.background( 200 );
		// draw outer/inner circle
		p.stroke( 255 );
		p.strokeWeight( 5 );
		p.noFill();
		p.ellipse( 0.5*pixelDim , 0.5* pixelDim , maxCursorRadius*2 , maxCursorRadius*2 );
		p.ellipse( 0.5*pixelDim , 0.5* pixelDim , minCursorRadius*2 , minCursorRadius*2 );
		// draw concentric circles
		p.stroke( 255 );
		p.strokeWeight( 1 );
		p.noFill();
		for( i = 1 ; i < 11 ; i++ ) {
			var r = minCursorRadius + ( maxCursorRadius - minCursorRadius ) * i / (10);
			p.ellipse( 0.5*pixelDim , 0.5*pixelDim , 2*r , 2*r );
		}
		// draw radii
		p.stroke( 255 );
		p.strokeWeight( 1 );
		p.noFill();
		for( i = 0 ; i < setNumPaths ; i++ ) {
			var angle = p.PI*2*i/setNumPaths;
			p.line( 0.5*pixelDim + p.sin(angle)*minCursorRadius , 
			        0.5*pixelDim + p.cos(angle)*minCursorRadius , 
			        0.5*pixelDim + p.sin(angle)*maxCursorRadius , 
			        0.5*pixelDim + p.cos(angle)*maxCursorRadius  );
		}
		// draw circles
		p.stroke( 0 );
		p.strokeWeight( 1 );
		p.fill( 255 );
		var d = 0.03*pixelDim;
		for( n = 0 ; n < setNumPaths/2 ; n++ ) {
			var angle = 4*p.PI*n / setNumPaths;
			var x = cPos.x;
			var y = cPos.y;
			var x1 = x*p.cos(angle) - y*p.sin(angle);
			var y1 = x*p.sin(angle) + y*p.cos(angle);
			var x2 = -x1;
			var y2 = y1;
			p.ellipse( x1 + 0.5*pixelDim , y1 + 0.5*pixelDim , d , d );
			p.ellipse( x2 + 0.5*pixelDim , y2 + 0.5*pixelDim , d , d );
		}
		// draw ellipse under mouse
		p.fill( 128 , 128 , 255 );
		p.ellipse( cPos.x + 0.5*pixelDim , cPos.y + 0.5*pixelDim , d , d );
	}
	
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
		// method to add a new vertex (from cursor position p5.Vector)
		this.addVert = function( cursorPosition ) {
			// only add if there is still space
			if( this.vertCounter < this.numVert ) {
				// get coordinates of primary path vertex
				var x = cursorPosition.x;
				var y = cursorPosition.y;
				var z = this.dz * this.vertCounter - 0.5*pixelDim;
				// store vertices of rotated and reflected paths
				for( n = 0 ; n < this.numPaths/2 ; n++ ) {
					var angle = 4*p.PI*n / this.numPaths;
					var vPixel1 = p.createVector( 
						x*p.cos(angle) - y*p.sin(angle) ,
						x*p.sin(angle) + y*p.cos(angle) ,
						z );
					var vPixel2 = p.createVector( -vPixel1.x , vPixel1.y , vPixel1.z );
					var vertOffset = p.createVector( 0 , 0 , 0.5*spaceDim + baseHeight );
					var vSpace1 = p5.Vector.mult( vPixel1 , pixelToSpace );
					vSpace1.add( vertOffset );
					var vSpace2 = p5.Vector.mult( vPixel2 , pixelToSpace );
					vSpace2.add( vertOffset );
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
		rsCanvas = p.createCanvas( pixelDim , pixelDim , p.WEBGL );
		if( p.windowWidth > p.windowHeight ) {
			rsCanvas.position( pixelDim + gapPixels , 0 );
		} else {
			rsCanvas.position( 0 , 0 );
		}
		rsCanvas.mouseOver( startRotInput );
		rsCanvas.mouseOut( stopRotInput );
		p.background( 220 );
	};
	p.draw = function() {
		p.background( 220 );
		// set viewpoint
		p.translate( 0 , 0 , -0.9*pixelDim );
		if( takingRotInput && p.mouseY>=0 && p.mouseY<=pixelDim && p.mouseX>=0 && p.mouseX<=pixelDim && blState === 'WAITING' ) {
			rotVal = -0.5*p.PI + ( p.mouseY - 0.5*pixelDim)  * 0.0025;
		} else {
			rotVal = -0.5*p.PI;
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
	p.keyTyped = function() {
		if (p.key === 'g') {
			outputBasketSTL( B , radialWidth , tangentWidth );
		}
	}
	startRotInput = function() {
		takingRotInput = true;
	};
	stopRotInput = function() {
		takingRotInput = false;
	};
	// writes triangle to .STL file
	function outputTriangleSTL( v0 , v1 , v2 , fileText ) {
		var x1 = p5.Vector.sub( v1 , v0 );
		var x2 = p5.Vector.sub( v2 , v0 );
		var n = p5.Vector.cross( x1 , x2 );
		n.normalize();
		p.append( fileText , "facet normal " + n.x + " " + n.y + " " + n.z );
		p.append( fileText , "\touter loop" );
		p.append( fileText , "\t\tvertex " + v0.x + " " + v0.y + " " + v0.z );
		p.append( fileText , "\t\tvertex " + v1.x + " " + v1.y + " " + v1.z );
		p.append( fileText , "\t\tvertex " + v2.x + " " + v2.y + " " + v2.z );
		p.append( fileText , "\tendloop" );
		p.append( fileText , "endfacet" );
	};
	// writes quadrilateral to .STL file
	function outputQuadSTL( v0 , v1 , v2 , v3 , fileText ) {
		var v4 = p.createVector( 0.25*( v0.x + v1.x + v2.x + v3.x ) , 
								 0.25*( v0.y + v1.y + v2.y + v3.y ) , 
								 0.25*( v0.z + v1.z + v2.z + v3.z ) );
		outputTriangleSTL( v4 , v0 , v1 , fileText );
		outputTriangleSTL( v4 , v1 , v2 , fileText );
		outputTriangleSTL( v4 , v2 , v3 , fileText );
		outputTriangleSTL( v4 , v3 , v0 , fileText );
	};
	// writes disc to .STL file
	function outputDisc( c , h , r , n  , fileText ) {
		var ud = p.createVector( 0 , 0 , 1 );
		// get initial vertices
		var ang = 0;
		var rd = p.createVector( p.cos( ang ) , p.sin( ang ) , 0 );
		var c0 = p5.Vector.add( c , p5.Vector.mult( ud , 0.5*h ) );
		var c1 = p5.Vector.add( c , p5.Vector.mult( ud , -0.5*h ) );
		var u0 = p5.Vector.add( c0 , p5.Vector.mult( rd , r ) );
		var u1 = p5.Vector.add( c1 , p5.Vector.mult( rd , r ) );
		// for each division
		for( i = 1 ; i < n+1 ; i++ ) {
			// get new vertices
			ang = i/n*2*p.PI;
			rd = p.createVector( p.cos( ang ) , p.sin( ang ) , 0 );
			var v0 = p5.Vector.add( c0 , p5.Vector.mult( rd , r ) );
			var v1 = p5.Vector.add( c1 , p5.Vector.mult( rd , r ) );
			// write out triangles and quad
			outputQuadSTL( u0 , u1 , v1 , v0 , fileText );
			outputTriangleSTL( u1 , c1 , v1 , fileText );
			outputTriangleSTL( v0 , c0 , u0 , fileText );
			// set initial vertices
			u0 = p.createVector( v0.x , v0.y , v0.z );
			u1 = p.createVector( v1.x , v1.y , v1.z );
		}
	}
	// writes washer to .STL file
	function outputWasher( c , h , r1 , r2 , n  , fileText ) {
		var ud = p.createVector( 0 , 0 , 1 );
		// get initial vertices
		var ang = 0;
		var rd = p.createVector( p.cos( ang ) , p.sin( ang ) , 0 );
		var c0 = p5.Vector.add( c , p5.Vector.mult( ud , 0.5*h ) );
		var c1 = p5.Vector.add( c , p5.Vector.mult( ud , -0.5*h ) );
		var u0 = p5.Vector.add( c0 , p5.Vector.mult( rd , r1 ) );
		var u1 = p5.Vector.add( c1 , p5.Vector.mult( rd , r1 ) );
		var u2 = p5.Vector.add( c1 , p5.Vector.mult( rd , r2 ) );
		var u3 = p5.Vector.add( c0 , p5.Vector.mult( rd , r2 ) );
		// for each division
		for( i = 1 ; i < n+1 ; i++ ) {
			// get new vertices
			ang = i/n*2*p.PI;
			rd = p.createVector( p.cos( ang ) , p.sin( ang ) , 0 );
			var v0 = p5.Vector.add( c0 , p5.Vector.mult( rd , r1 ) );
			var v1 = p5.Vector.add( c1 , p5.Vector.mult( rd , r1 ) );
			var v2 = p5.Vector.add( c1 , p5.Vector.mult( rd , r2 ) );
			var v3 = p5.Vector.add( c0 , p5.Vector.mult( rd , r2 ) );
			// write out triangles and quad
			outputQuadSTL( u3 , u2 , v2 , v3 , fileText );
			outputQuadSTL( u2 , u1 , v1 , v2 , fileText );
			outputQuadSTL( v0 , v1 , u1 , u0 , fileText );
			outputQuadSTL( v0 , u0 , u3 , v3 , fileText );
			// set initial vertices
			u0 = p.createVector( v0.x , v0.y , v0.z );
			u1 = p.createVector( v1.x , v1.y , v1.z );
			u2 = p.createVector( v2.x , v2.y , v2.z );
			u3 = p.createVector( v3.x , v3.y , v3.z );
		}
	}
	// writes basket out to .STL file
	function outputBasketSTL( B , rw , tw ) {
		var fileText = new Array(  "solid basketLathe\n" );
		// for each path
		for( n = 0 ; n < B.numPaths ; n++ ) {
			// get the first layer of vertices
			var u = p.createVector( B.spaceVert[n][0].x , B.spaceVert[n][0].y , B.spaceVert[n][0].z );
			var rd = p.createVector( u.x , u.y , 0 );
			rd.normalize();
			var ud = p.createVector( 0 , 0 , 1 );
			var td = p5.Vector.cross( ud ,rd );
			var u0 = p5.Vector.add( u ,  p5.Vector.mult( td , 0.5*tw ) );
			var u1 = p5.Vector.add( u0 , p5.Vector.mult( rd , -1*rw ) );
			var u2 = p5.Vector.add( u1 , p5.Vector.mult( td , -1*tw ) );
			var u3 = p5.Vector.add( u2 , p5.Vector.mult( rd , rw ) );
			// write out the bottom
			outputQuadSTL( u2 , u3 , u0 , u1 , fileText );
			// for each subsequent layer
			for( i = 1 ; i < B.numVert ; i++ ) {
				// get next layer of vertices
				var v = p.createVector( B.spaceVert[n][i].x , B.spaceVert[n][i].y , B.spaceVert[n][i].z );
				rd = p.createVector( v.x , v.y , 0 );
				rd.normalize();
				td = p5.Vector.cross( ud ,rd );
				var v0 = p5.Vector.add( v ,  p5.Vector.mult( td , 0.5*tw ) );
				var v1 = p5.Vector.add( v0 , p5.Vector.mult( rd , -1*rw ) );
				var v2 = p5.Vector.add( v1 , p5.Vector.mult( td , -1*tw ) );
				var v3 = p5.Vector.add( v2 , p5.Vector.mult( rd , rw ) );
				// write out 4 quads
				outputQuadSTL( u0 , v0 , v3 , u3 , fileText );
				outputQuadSTL( u1 , v1 , v0 , u0 , fileText );
				outputQuadSTL( u2 , v2 , v1 , u1 , fileText );
				outputQuadSTL( u3 , v3 , v2 , u2 , fileText );
				// set previous layer of vertices
				u = p.createVector( v.x , v.y , v.z );
				rd = p.createVector( u.x , u.y , 0);
				rd.normalize();
				ud = p.createVector( 0 , 0 , 1 );
				td = p5.Vector.cross( ud ,rd );
				u0 = p5.Vector.add( u ,  p5.Vector.mult( td , 0.5*tw ) );
				u1 = p5.Vector.add( u0 , p5.Vector.mult( rd , -1*rw ) );
				u2 = p5.Vector.add( u1 , p5.Vector.mult( td , -1*tw ) );
				u3 = p5.Vector.add( u2 , p5.Vector.mult( rd , rw ) );
			}
			// write out the top
			outputQuadSTL( v0 , v1 , v2 , v3 , fileText );
		}
		// write out base
		var c = p.createVector( 0 , 0 , 0.5*baseHeight );
		var h = baseHeight;
		var radial = p.createVector( B.spaceVert[0][0].x , B.spaceVert[0][0].y , 0 );
		var r2 = radial.mag();
		var n = 100;
		outputDisc( c , h , r2 , n  , fileText )
		// write out rim
		/*
		c = p.createVector( 0 , 0 , baseHeight + spaceDim + 0.5*topHeight );
		radial = p.createVector( B.spaceVert[0][B.numVert-1].x , B.spaceVert[0][B.numVert-1].y , 0 );
		r2 = radial.mag();
		var r1 = r2 - rw;
		outputWasher( c , h , r1 , r2 , n  , fileText )
		*/
		// write out end of file
		p.append( fileText , "endsolid basketLathe\n" );
		p.save( fileText , 'basketLathe' , 'stl' );
	}
}
var rS = new p5( renderSpace , 'canvas2' );
