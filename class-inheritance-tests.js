var C1 = function() {

  			EventEmitter.call(this);

  			this.method1 = function() {
  				console.log("method 1 invoked");
  			}

  		}

  		C1.prototype = Object.create(EventEmitter.prototype);

  		C1.prototype.constructor = C1;

  		var i = new C1();




  		var C2 = function(a) {

  			var a = a - 1;

  			this.method1 = function() {
  				console.log(a);
  			}

        this.method2 = function() {
          console.log(a + 2);
        }
  		}

  		var C3 = function(a) {

  			C2.call(this, a);

  			var a = a;

  			this.method2 = function() {
  				console.log(a);
  			}

  		}

      C3.prototype = Object.create(C2.prototype);

      C3.prototype.constructor = C3;

      C3.prototype.method4 = function() {
        console.log("method 4 @ C3");
      }