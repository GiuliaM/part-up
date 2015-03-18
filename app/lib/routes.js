/*************************************************************/
/* Home */
/*************************************************************/
Router.route('/', {
    name: 'home',
    where: 'client',
    layoutTemplate: 'LayoutsApp',
    yieldRegions: { 
        'PagesHome': { to: 'page' },
    }
});

/*************************************************************/
/* Partup detail */
/*************************************************************/
Router.route('/partups/:id', {
    name: 'partup-detail',
    where: 'client',
    layoutTemplate: 'LayoutsApp',
    yieldRegions: {
        'PagesPartupDetail': { to: 'page' },
        'PagesPartupDetailUpdates': { to: 'partup-page' }
    }
});

Router.route('/partups/:id/activities', {
    name: 'partup-detail-activities',
    where: 'client',
    layoutTemplate: 'LayoutsApp',
    yieldRegions: {
        'PagesPartupDetail': { to: 'page' },
        'PagesPartupDetailActivities': { to: 'partup-page' }
    }
});

Router.route('/partups/:id/budget', {
    name: 'partup-detail-budget',
    where: 'client',
    layoutTemplate: 'LayoutsApp',
    yieldRegions: {
        'PagesPartupDetail': { to: 'page' },
        'PagesPartupDetailBudget': { to: 'partup-page' }
    }
});

Router.route('/partups/:id/anticontract', {
    name: 'partup-detail-anticontract',
    where: 'client',
    layoutTemplate: 'LayoutsApp',
    yieldRegions: {
        'PagesPartupDetail': { to: 'page' },
        'PagesPartupDetailAnticontract': { to: 'partup-page' }
    }
});

/*************************************************************/
/* Start Partup */
/*************************************************************/
Router.route('/startpartup', {
    name: 'startpartup',
    where: 'client',
    layoutTemplate: 'LayoutsFullpage',
    yieldRegions: {
        'PagesStartPartup': { to: 'page' },
        'PagesStartPartupDetails': { to: 'start-partup-page' }
    }
});

Router.route('/startpartup/activities', {
    name: 'startpartup-activities',
    where: 'client',
    layoutTemplate: 'LayoutsFullpage',
    yieldRegions: {
        'PagesStartPartup': { to: 'page' },
        'PagesStartPartupActivities': { to: 'start-partup-page' }
    }
});

Router.route('/startpartup/contributions', {
    name: 'startpartup-contributions',
    where: 'client',
    layoutTemplate: 'LayoutsFullpage',
    yieldRegions: {
        'PagesStartPartup': { to: 'page' },
        'PagesStartPartupContributions': { to: 'start-partup-page' }
    }
});

Router.route('/startpartup/promotion', {
    name: 'startpartup-promotion',
    where: 'client',
    layoutTemplate: 'LayoutsFullpage',
    yieldRegions: {
        'PagesStartPartup': { to: 'page' },
        'PagesStartPartupPromotion': { to: 'start-partup-page' }
    }
});

/*************************************************************/
/* Register flow */
/*************************************************************/
Router.route('/register', {
    name: 'register',
    where: 'client',
    layoutTemplate: 'LayoutsFullpage',
    yieldRegions: {
        'PagesRegister': { to: 'page' },
        'PagesRegisterRequired': { to: 'register-page' }
    }
});

Router.route('/register/optional', {
    name: 'register-optional',
    where: 'client',
    layoutTemplate: 'LayoutsFullpage',
    yieldRegions: {
        'PagesRegister': { to: 'page' },
        'PagesRegisterRequired': { to: 'register-page' }
    }
});