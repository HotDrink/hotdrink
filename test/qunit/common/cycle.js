(function () {

  var Model = hd.model(function Model() {

      // This test is for a "hidden dependency"
      // cc is not used as on output, so the dependency
      // does not show up, until evaluation, and thus
      // a cycle can occur

      // Constraint 1:
      // bb <== aa, cc
      // aa <== bb, cc 

      // Constraint 2:
      // cc <== bb, dd
      // bb <== cc, dd
      // dd <== bb, cc
 
      // The cycle occurs with priority order dd, aa, cc.
      // The (best, there are two) way out of the cycle is the flow 
      // bb <== cc, dd and aa <== bb, cc

      this.aa = hd.variable(1);
      this.bb = hd.variable(1);
      this.cc = hd.variable(1);
    
      hd.constraint(this.cc)
          .method(this.aa, function () {
              this.bb();
              this.cc();
              return "m1";
          })
          .method(this.bb, function () {
              this.aa();
              this.cc();
              return "m2";
          });

      this.dd = hd.variable(1);

      hd.constraint() 
          .method(this.cc, function() {
              this.bb();
              this.dd(); 
              return "m3";
          })
          .method(this.dd, function() {
              this.bb();
              this.cc(); 
              return "m4";
          })
          .method(this.bb, function() {
              this.cc();
              this.dd(); 
              return "m5";
          })
  });

  hottest.cycle = {
    Model: Model
  };

}());

