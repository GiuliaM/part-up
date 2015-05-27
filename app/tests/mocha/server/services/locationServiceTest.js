if (!(typeof MochaWeb === 'undefined')){
    MochaWeb.testOnly(function(){

        describe("Partup Service", function(){
            it('transforms a partup location to a location input', function(done) {
                var location = {
                    city: 'amsterdam',
                    country: 'netherlands'
                };
                chai.assert.equal(Partup.services.location.locationToLocationInput(location) , 'amsterdam');
                done();
            });
        });
    });
}
