var Cache = Partup.server.services.cache;

Meteor.methods({
    /**
     * Insert a Partup
     *
     * @param {mixed[]} fields
     */
    'partups.insert': function(fields) {
        check(fields, Partup.schemas.forms.partupCreate);

        var user = Meteor.user();
        if (!user) throw new Meteor.Error(401, 'unauthorized');

        try {
            var newPartup = Partup.transformers.partup.fromFormStartPartup(fields);
            newPartup._id = Random.id();
            newPartup.uppers = [user._id];
            newPartup.creator_id = user._id;
            newPartup.created_at = new Date();
            newPartup.slug = Partup.server.services.slugify.slugifyDocument(newPartup, 'name');
            newPartup.upper_data = [];
            newPartup.shared_count = {
                facebook: 0,
                twitter: 0,
                linkedin: 0,
                email: 0
            };
            newPartup.refreshed_at = new Date();

            //check(newPartup, Partup.schemas.entities.partup);

            Partups.insert(newPartup);
            Meteor.users.update(user._id, {$addToSet: {'upperOf': newPartup._id}});

            return {
                _id: newPartup._id,
                slug: newPartup.slug
            };
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_could_not_be_inserted');
        }
    },

    /**
     * Update a Partup
     *
     * @param {string} partupId
     * @param {mixed[]} fields
     */
    'partups.update': function(partupId, fields) {
        check(partupId, String);
        check(fields, Partup.schemas.forms.partupUpdate);

        var user = Meteor.user();
        var partup = Partups.findOneOrFail(partupId);

        var uppers = partup.uppers || [];

        if (!partup.isEditableBy(user)) {
            throw new Meteor.Error(401, 'unauthorized');
        }

        try {
            var newPartupFields = Partup.transformers.partup.fromFormStartPartup(fields);

            // update the slug when the name has changed
            if (fields.name) {
                var document = {
                    _id: partup._id,
                    name: newPartupFields.name
                };
                newPartupFields.slug = Partup.server.services.slugify.slugifyDocument(document, 'name');
            }

            Partups.update(partupId, {$set: newPartupFields});

            return {
                _id: partup._id
            };
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_could_not_be_updated');
        }
    },

    /**
     * Remove a Partup
     *
     * @param {string} partupId
     */
    'partups.remove': function(partupId) {
        check(partupId, String);

        var user = Meteor.user();
        var partup = Partups.findOneOrFail(partupId);

        if (!partup.isRemovableBy(user)) {
            throw new Meteor.Error(401, 'unauthorized');
        }

        try {
            partup.remove();

            return {
                _id: partup._id
            };
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_could_not_be_removed');
        }
    },

    /**
     * Discover partups based on provided filters
     *
     * @param {Object} parameters
     * @param {string} options.networkId
     * @param {string} options.locationId
     * @param {string} options.sort
     * @param {string} options.textSearch
     * @param {number} options.limit
     * @param {string} options.language
     */
    'partups.discover': function(parameters) {
        check(parameters, {
            networkId: Match.Optional(String),
            locationId: Match.Optional(String),
            sort: Match.Optional(String),
            textSearch: Match.Optional(String),
            limit: Match.Optional(Number),
            language: Match.Optional(String)
        });

        var userId = Meteor.userId();

        var cacheId = 'discover_partupids_' + JSON.stringify(parameters);
        if (!userId && Cache.has(cacheId)) {
            return Cache.get(cacheId) || [];
        }

        var options = {};
        parameters = parameters || {};

        if (parameters.limit) options.limit = parseInt(parameters.limit);

        parameters = {
            networkId: parameters.networkId,
            locationId: parameters.locationId,
            sort: parameters.sort,
            textSearch: parameters.textSearch,
            limit: parameters.limit,
            language: (parameters.language === 'all') ? undefined : parameters.language
        };

        var partupIds = Partups.findForDiscover(userId, options, parameters).map(function(partup) {
            return partup._id;
        });

        if (!userId) Cache.set(cacheId, partupIds, 3600);

        return partupIds;
    },

    /**
     * Return a list of partups based on search query
     *
     * @param {string} searchString
     * @param {string} exceptPartupId
     * @param {boolean} onlyPublic When this is true, only public partups will be returned
     */
    'partups.autocomplete': function(searchString, exceptPartupId, onlyPublic) {
        check(searchString, String);
        check(exceptPartupId, Match.Optional(String));
        check(onlyPublic, Match.Optional(Boolean));

        var user = Meteor.user();
        if (!user) throw new Meteor.Error(401, 'unauthorized');
        onlyPublic = onlyPublic || false;

        var selector = {};

        selector.name = new RegExp('.*' + searchString + '.*', 'i');
        selector._id = {$ne: exceptPartupId};

        if (onlyPublic) {
            selector.privacy_type = {'$in': [Partups.PUBLIC, Partups.NETWORK_PUBLIC]};
        }

        try {
            return Partups.guardedFind(Meteor.userId(), selector, {limit: 30}).fetch();
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partups_could_not_be_autocompleted');
        }
    },

    /**
     * Feature a specific partup (superadmin only)
     *
     * @param {string} partupId
     * @param {mixed[]} fields
     */
    'partups.feature': function(partupId, fields) {
        check(partupId, String);
        check(fields, Partup.schemas.forms.featurePartup);

        var user = Meteor.user();
        if (!user) throw new Meteor.Error(401, 'unauthorized');
        if (!User(user).isAdmin()) throw new Meteor.Error(401, 'unauthorized');

        try {
            var author = Meteor.users.findOne(fields.author_id);
            featured = {
                'active': true,
                'by_upper': {
                    '_id': author._id,
                    'title': fields.job_title
                },
                'comment': fields.comment
            };

            Partups.update(partupId, {$set: {'featured': featured}});

        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partups_could_not_be_featured');
        }
    },

    /**
     * Unfeature a specific partup (superadmin only)
     *
     * @param {string} kId
     * @param {mixed[]} fields
     */
    'partups.unfeature': function(partupId) {
        check(partupId, String);

        var user = Meteor.user();
        if (!user) throw new Meteor.Error(401, 'unauthorized');
        if (!User(user).isAdmin()) throw new Meteor.Error(401, 'unauthorized');

        try {
            Partups.update(partupId, {$unset: {'featured': ''}});
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_could_not_be_unfeatured');
        }
    },

    /**
    * Returns partup stats to superadmins only
    */
    'partups.admin_all': function() {
        var user = Meteor.users.findOne(this.userId);
        if (!User(user).isAdmin()) {
            return;
        }
        return Partups.findStatsForAdmin();
    },

    /**
     * Random featured partup
     */
    'partups.featured_one_random': function(language) {
        check(language, String);

        this.unblock();

        var selector = {'featured.active': true};
        if (language) {
            selector.language = language;
        }
        var count = Partups.guardedMetaFind(selector, {}).count();
        var random = Math.floor(Math.random() * count);

        var partup = Partups.guardedMetaFind(selector, {limit: 1, skip: random}).fetch().pop();

        if (!partup) throw new Meteor.Error(404, 'no_featured_partup_found');

        return partup._id;
    },

    /**
     * Consume an access token and add the user to the invites
     */
    'partups.convert_access_token_to_invite': function(partupId, accessToken) {
        check(partupId, String);
        check(accessToken, String);

        var user = Meteor.user();
        var partup = Partups.findOneOrFail(partupId);

        try {
            partup.convertAccessTokenToInvite(user._id, accessToken);
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_access_token_could_not_be_converted_to_invite');
        }
    },

    /**
     * Reset new updates count
     *
     * @param {String} partupId
     */
    'partups.reset_new_updates': function(partupId) {
        check(partupId, String);

        try {
            Partups.update({_id: partupId, 'upper_data._id': Meteor.userId()}, {$set: {'upper_data.$.new_updates': []}});
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_new_updates_could_not_be_reset');
        }
    },

    /**
     * Increase email share count
     *
     * @param {String} partupId
     */
    'partups.increase_email_share_count': function(partupId) {
        check(partupId, String);

        try {
            var partup = Partups.findOneOrFail(partupId);
            partup.increaseEmailShareCount();
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_email_share_count_could_not_be_updated');
        }
    },

    /**
     * Invite an existing upper to a partup
     *
     * @param {string} partupId
     * @param {string} inviteeId
     */
    'partups.invite_existing_upper': function(partupId, inviteeId) {
        check(partupId, String);
        check(inviteeId, String);

        var inviter = Meteor.user();
        if (!inviter) {
            throw new Meteor.Error(401, 'unauthorized');
        }

        var partup = Partups.findOneOrFail(partupId);
        var isAllowedToAccessPartup = !!Partups.guardedFind(inviter._id, {_id: partup._id}).count() > 0;
        if (!isAllowedToAccessPartup) {
            throw new Meteor.Error(401, 'unauthorized');
        }

        if (partup.isRemoved()) throw new Meteor.Error(404, 'partup_could_not_be_found');

        var invitee = Meteor.users.findOneOrFail(inviteeId);

        var isAlreadyInvited = !!Invites.findOne({
            partup_id: partup._id,
            invitee_id: invitee._id,
            inviter_id: inviter._id,
            type: Invites.INVITE_TYPE_PARTUP_EXISTING_UPPER
        });
        if (isAlreadyInvited) {
            throw new Meteor.Error(403, 'user_is_already_invited_to_partup');
        }

        var invite = {
            type: Invites.INVITE_TYPE_PARTUP_EXISTING_UPPER,
            partup_id: partup._id,
            inviter_id: inviter._id,
            invitee_id: invitee._id,
            created_at: new Date
        };

        Invites.insert(invite);

        // Add to the invite list of the partup
        if (!partup.hasInvitedUpper(invitee._id)) {
            Partups.update(partup._id, {$addToSet: {invites: invitee._id}});
        }

        Event.emit('invites.inserted.partup', inviter, partup, invitee);
    },

    /**
     * Invite someone to an partup
     *
     * @param {string} partupId
     * @param {string} email
     * @param {string} name
     */
    'partups.invite_by_email': function(partupId, fields) {
        check(fields, Partup.schemas.forms.inviteUpper);

        var inviter = Meteor.user();

        if (!inviter) {
            throw new Meteor.Error(401, 'unauthorized');
        }

        var partup = Partups.findOneOrFail(partupId);

        if (partup.isRemoved()) throw new Meteor.Error(404, 'partup_could_not_be_found');

        var isAllowedToAccessPartup = !!Partups.guardedFind(inviter._id, {_id: partup._id}).count() > 0;
        if (!isAllowedToAccessPartup) {
            throw new Meteor.Error(401, 'unauthorized');
        }

        var isAlreadyInvited = !!Invites.findOne({
            partup_id: partupId,
            invitee_email: fields.email,
            type: Invites.INVITE_TYPE_PARTUP_EMAIL
        });

        if (isAlreadyInvited) {
            throw new Meteor.Error(403, 'email_is_already_invited_to_partup');
        }

        var accessToken = Random.secret();

        var invite = {
            type: Invites.INVITE_TYPE_PARTUP_EMAIL,
            partup_id: partup._id,
            inviter_id: inviter._id,
            invitee_name: fields.name,
            invitee_email: fields.email,
            message: fields.message,
            access_token: accessToken,
            created_at: new Date
        };

        Invites.insert(invite);

        Event.emit('invites.inserted.partup.by_email', inviter, partup, fields.email, fields.name, fields.message, accessToken);
    },

    /**
     * Get user suggestions for a given partup
     *
     * @param {string} partupId
     * @param {Object} options
     * @param {string} options.locationId
     * @param {string} options.query
     *
     * @return {[string]}
     */
    'partups.user_suggestions': function(partupId, options) {
        check(partupId, String);
        check(options, {
            locationId: Match.Optional(String),
            query: Match.Optional(String)
        });

        this.unblock();

        var upper = Meteor.user();

        if (!upper) {
            throw new Meteor.Error(401, 'Unauthorized');
        }

        var users = Partup.server.services.matching.matchUppersForPartup(partupId, options);

        // We are returning an array of IDs instead of an object
        return users.map(function(user) {
            return user._id;
        });
    }
});
