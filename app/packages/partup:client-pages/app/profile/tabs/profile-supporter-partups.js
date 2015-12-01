var partupsToColumnTiles = function(partups) {
    return lodash.map(partups, function(partup) {
        return {
            partup: partup
        };
    });
};

Template.app_profile_supporter_partups.onCreated(function() {
    var tpl = this;

    var profileId = tpl.data.profileId;

    tpl.partups = {

        // Constants
        STARTING_LIMIT: 12,
        INCREMENT: 8,

        // States
        loading: new ReactiveVar(false),
        count_loading: new ReactiveVar(false),
        infinitescroll_loading: new ReactiveVar(false),
        end_reached: new ReactiveVar(false),

        // Namespace for columns layout functions (added by helpers)
        layout: {
            items: [],
            count: new ReactiveVar(0)
        },

        // Partups subscription handle
        handle: null,
        count_handle: null,

        // PartupTile data
        partupTileData: function(partup) {
            var data = lodash.cloneDeep(partup);
            return data;
        },

        // Options reactive variable (on change, clear the layout and re-add all partups)
        options: new ReactiveVar({}, function(a, b) {
            tpl.partups.resetLimit();

            var options = b;
            options.limit = tpl.partups.STARTING_LIMIT;

            // Set users.one.supporterpartups.count subscription
            if (tpl.partups.count_handle) tpl.partups.count_handle.stop();
            tpl.partups.count_handle = tpl.subscribe('users.one.supporterpartups.count', profileId, options, {
                onReady: function() {
                    tpl.partups.count_loading.set(false);

                    var new_count = Counts.get('users.one.supporterpartups.filterquery');
                    tpl.partups.layout.count.set(new_count);
                }
            });
            tpl.partups.count_loading.set(true);

            // Set users.one.supporterpartups subscription
            if (tpl.partups.handle) tpl.partups.handle.stop();
            tpl.partups.handle = tpl.subscribe('users.one.supporterpartups', {id: profileId}, options, {
                onReady: function() {
                    tpl.partups.loading.set(false);

                    var user = Meteor.users.findOne(profileId);
                    var partups = Partups.findSupporterPartupsForUser(user).fetch();

                    var partupTileDatas = lodash.map(partups, function(partup) {
                        return tpl.partups.partupTileData(partup);
                    });

                    tpl.partups.layout.items = tpl.partups.layout.clear();
                    tpl.partups.layout.items = tpl.partups.layout.add(partupsToColumnTiles(partupTileDatas));
                }
            });
            tpl.partups.loading.set(true);
        }),

        // Limit reactive variable (on change, add partups to the layout)
        limit: new ReactiveVar(this.STARTING_LIMIT, function(a, b) {
            var first = b === tpl.partups.STARTING_LIMIT;
            if (first) return;

            var options = tpl.partups.options.get();
            options.limit = b;

            var oldHandle = tpl.partups.handle;
            tpl.partups.handle = tpl.subscribe('users.one.supporterpartups', {id: profileId}, {}, {
                onReady: function() {
                    tpl.partups.infinitescroll_loading.set(false);

                    var user = Meteor.users.findOne(profileId);
                    var oldPartups = tpl.partups.layout.items;
                    var newPartups = Partups.findSupporterPartupsForUser(user).fetch();

                    var diffPartups = mout.array.filter(newPartups, function(partup) {
                        return !mout.array.find(oldPartups, function(item) {
                            return partup._id === item.partup._id;
                        });
                    });

                    var end_reached = diffPartups.length === 0;
                    tpl.partups.end_reached.set(end_reached);

                    var partupTileDatas = lodash.map(diffPartups, function(partup) {
                        return tpl.partups.partupTileData(partup);
                    });

                    tpl.partups.layout.items = tpl.partups.layout.add(partupsToColumnTiles(partupTileDatas));
                }
            });
            tpl.partups.infinitescroll_loading.set(true);
        }),

        // Increase limit function
        increaseLimit: function() {
            tpl.partups.limit.set(tpl.partups.limit.get() + tpl.partups.INCREMENT);
        },

        // Reset limit function
        resetLimit: function() {
            tpl.partups.limit.set(tpl.partups.STARTING_LIMIT);
            tpl.partups.end_reached.set(false);
        }
    };

    // First run
    tpl.partups.options.set({});
});

Template.app_profile_supporter_partups.onRendered(function() {
    var tpl = this;

    /**
     * Infinite scroll
     */
    Partup.client.scroll.infinite({
        template: tpl,
        element: tpl.find('[data-infinitescroll-container]')
    }, function() {
        if (tpl.partups.loading.get() || tpl.partups.end_reached.get()) return;
        tpl.partups.increaseLimit();
    });
});

Template.app_profile_supporter_partups.helpers({
    count: function() {
        return Template.instance().partups.layout.count.get() || '';
    },
    partupsLoading: function() {
        var tpl = Template.instance();
        return tpl.partups.loading.get() || tpl.partups.count_loading.get();
    },
    firstname: function() {
        var user = Meteor.users.findOne(this.profileId);
        return User(user).getFirstname();
    },

    // We use this trick to be able to call a function in a child template.
    // The child template directly calls 'addToLayoutHook' with a callback.
    // We save that callback, so we can call it later and the child template can react to it.
    addToLayoutHook: function() {
        var tpl = Template.instance();

        return function registerCallback(callback) {
            tpl.partups.layout.add = callback;
        };
    },
    clearLayoutHook: function() {
        var tpl = Template.instance();

        return function registerCallback(callback) {
            tpl.partups.layout.clear = callback;
        };
    },
    rerenderLayoutHook: function() {
        var tpl = Template.instance();

        return function registerCallback(callback) {
            tpl.partups.layout.rerender = callback;
        };
    },
    amountOfColumns: function() {
        var tpl = Template.instance();
        var smaller = Partup.client.screen.size.get('width') < Partup.client.grid.getWidth(11) + 80;
        Meteor.defer(function() {
            tpl.partups.layout.rerender();
        });
        return smaller ? 3 : 4;
    }
});
