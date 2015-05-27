if (!(typeof MochaWeb === 'undefined')){
    MochaWeb.testOnly(function(){

        describe("Strings Service", function(){
            it('slugifies string', function(done) {
                chai.assert.equal(Partup.ui.strings.slugify('Accounts.LoginCancelledError') , 'Accounts-LoginCancelledError');
                chai.assert.equal(Partup.ui.strings.slugify('bla afterspace') , 'bla-afterspace');
                done();
            });

            it('transforms name into firstname', function(done) {
                chai.assert.equal(Partup.ui.strings.firstName('Piet Poster') , 'Piet');
                chai.assert.equal(Partup.ui.strings.firstName('Piet Poster Paaltje') , 'Piet');
                chai.assert.equal(Partup.ui.strings.firstName('Piet   Poster  Paaltje') , 'Piet');
                chai.assert.equal(Partup.ui.strings.firstName('Namewithoutspace') , 'Namewithoutspace');
                done();
            });
        });
    });
}
