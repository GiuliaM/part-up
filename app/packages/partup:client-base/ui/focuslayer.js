Partup.ui.focuslayer = {

    state: new ReactiveVar(),

    // Enable the focuslayer
    enable: function () {
        this.state.set(true);
    },

    // Disable the focuslayer
    disable: function () {
        this.state.set(false);
    }

};