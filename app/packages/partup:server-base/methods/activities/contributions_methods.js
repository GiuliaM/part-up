Meteor.methods({
    /**
     * Insert a Contribution
     *
     * @param {integer} activityId
     * @param {mixed[]} fields
     */
    'contributions.insert': function (activityId, fields) {
        var upper = Meteor.user();
        var activity = Activities.findOneOrFail(activityId);

        if (!upper) throw new Meteor.Error(401, 'Unauthorized.');

        check(fields, Partup.schemas.forms.contribution);

        try {
            var newContribution = Partup.transformers.contribution.fromFormContribution(fields);

            newContribution.created_at = Date.now();
            newContribution.activity_id = activityId;
            newContribution.upper_id = upper._id;
            newContribution.partup_id = activity.partup_id;

            newContribution._id = Contributions.insert(newContribution);
            Activities.update(activityId, { $push: { 'contributions': newContribution._id } });

            Event.emit('contributions.inserted', newContribution);

            return {
                _id: newContribution._id
            }
         } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'Contribution could not be inserted.');
        }
    },

    /**
     * Update a Contribution
     *
     * @param {integer} contributionId
     * @param {mixed[]} fields
     */
    'contributions.update': function (contributionId, fields) {
        var upper = Meteor.user();
        var contribution = Contributions.findOneOrFail(contributionId);

        if (!upper || contribution.upper_id !== upper._id) {
            throw new Meteor.Error(401, 'Unauthorized.');
        }

        check(fields, Partup.schemas.forms.contribution);

        try {
            var newContribution = Partup.transformers.contribution.fromFormContribution(fields);
            newContribution.updated_at = Date.now();

            Contributions.update(contributionId, { $set: newContribution });
            Event.emit('contributions.updated', contribution, fields);

            return {
                _id: contribution._id
            }
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'Contribution could not be updated.');
        }
    }
});
