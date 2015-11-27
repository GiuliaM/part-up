/*
 * Count route for /networks/:0/partups
 */
Router.route('/networks/:slug/partups/count', {where: 'server'}).get(function() {
    var request = this.request;
    var response = this.response;
    var params = this.params;

    // We are going to respond in JSON format
    response.setHeader('Content-Type', 'application/json');

    var parameters = {
        limit: request.query.limit,
        skip: request.query.skip
    };

    var userId = request.user ? request.user._id : null;

    var network = Networks.guardedFind(this.userId, {slug: params.slug}).fetch().pop();
    if (!network) {
        response.statusCode = 400;
        return response.end(JSON.stringify({error: {reason: 'error-network-notfound'}}));
    }

    var networks = Partups.findForNetwork(network, {}, {}, userId);

    return response.end(JSON.stringify({error: false, count: networks.count()}));
});

/*
 * Count route for /networks/:0/uppers
 */
Router.route('/networks/:slug/uppers/count', {where: 'server'}).get(function() {
    var request = this.request;
    var response = this.response;
    var params = this.params;

    // We are going to respond in JSON format
    response.setHeader('Content-Type', 'application/json');

    var parameters = {
        limit: request.query.limit,
        skip: request.query.skip
    };

    var userId = request.user ? request.user._id : null;

    var network = Networks.guardedFind(this.userId, {slug: params.networkSlug}).fetch().pop();
    if (!network) {
        response.statusCode = 400;
        response.end(JSON.stringify({error: {reason: 'error-network-notfound'}}));
    }

    var networks = Partups.findForNetwork(network, {}, {}, userId);

    return response.end(JSON.stringify({error: false, count: networks.count()}));
});
