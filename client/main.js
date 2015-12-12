/////
// template helpers
/////

// helper function that returns all available websites
Template.website_list.helpers({
    websites: function() {
        if (Session.get("searchFilter")) {
            return Websites.find({
                $or: [{
                    "title": new RegExp(Session.get("searchFilter"), "i")
                }, {
                    "description": new RegExp(Session.get("searchFilter"), "i")
                }]
            }, {
                sort: {
                    "up": -1
                },
                limit: Session.get("websiteLimit")
            });
        } else {
            return Websites.find({}, {
                sort: {
                    "up": -1
                },
                limit: Session.get("websiteLimit")
            });
        }

    },
});

Template.comment.helpers({
    getUser: function(user_id) {
        var user = Meteor.users.findOne({
            _id: user_id
        });
        if (user) {
            return user.username;
        } else {
            return "anon";
        }
    }
});

/////
// template events
/////

var voteEvents = {
    "click .js-upvote": function(event) {
        // example of how you can access the id for the website in the database
        // (this is the data context for the template)
        var website_id = this._id;
        console.log("Up voting website with id " + website_id);
        // put the code in here to add a vote to a website!
        Websites.update({
            "_id": website_id
        }, {
            $inc: {
                "up": 1
            }
        });

        return false; // prevent the button from reloading the page
    },
    "click .js-downvote": function(event) {

        // example of how you can access the id for the website in the database
        // (this is the data context for the template)
        var website_id = this._id;
        console.log("Down voting website with id " + website_id);

        Websites.update({
            "_id": website_id
        }, {
            $inc: {
                "down": -1
            }
        });

        return false; // prevent the button from reloading the page
    },
    "click .js-add-comment": function(event) {
        //event.preventDefault();

        var comment = $('#comment').val();
        var id = Meteor.userId();
        var website_id = this._id;

        if (!Meteor.user()) {
            $('#security .modal-body').text('You are not allowed to do this');
            $('#security').modal('show');
        } else if (comment == "") {
            $('#security .modal-body').text('Enter text');
            $('#security').modal('show');
        } else {
            Websites.update({
                "_id": website_id
            }, {
                $push: {
                    "comments": {
                        "comment": comment,
                        "user_id": id,
                        "createdOn": new Date()
                    }
                }
            });
            $('#comment').val("");
        }

        return false;
    }

}
Template.website_item.events(voteEvents);
Template.website.events(voteEvents);
Template.website_form.events({
    "click .js-toggle-website-form": function(event) {
        $("#website_form").toggle('slow');
    },
    "submit .js-save-website-form": function(event) {

        event.preventDefault();

        // here is an example of how to get the url out of the form:
        var url = event.target.url.value;
        var description;
        var title;
        var regex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
        console.log("The url they entered is: " + url + " and the title and description are: " + title + ", " + description);
        //  put your website saving code in here!


        if (!Meteor.user()) {
            $('#security .modal-body').text('You are not allowed to do this');
            $('#security').modal('show');
        } else if (url === "" || !url.match(regex)) {
            $('#security .modal-body').text('Enter url (http:// format) && description, please');
            $('#security').modal('show');
        } else {
            extractMeta(url, function(err, res) {
                if (res) {
                    console.log(res);
                    description = res.description;
                    title = res.title;
                }

                Websites.insert({
                    url: url,
                    title: title !== undefined ? res.title : url,
                    description: description !== undefined ? res.description : "No Description available",
                    up: 0,
                    down: 0,
                    comments: [],
                    createdOn: new Date(),
                    createdBy: Meteor.user()._id
                });
            });

            $('#url').val("");
            $('#title').val("");
            $('#description').val("");
        }

        return false; // stop the form submit from reloading the page

    }
});

Template.navbar.events({
    'keyup #search-input': function(event) {
        event.preventDefault();
        var text;

        if ($('#search-input').val() !== "") {
            text = $('#search-input').val();
            $('.js-total').fadeIn('fast');
        } else {
            text = "";
            $('.js-total').fadeOut('slow');
        }
        Session.set("searchFilter", text);
    }
});



/// infiniscroll
Session.set("websiteLimit", 8);
lastScrollTop = 0;
$(window).scroll(function(event) {
    // test if we are near the bottom of the window
    if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
        // where are we in the page?
        var scrollTop = $(this).scrollTop();
        // test if we are going down
        if (scrollTop > lastScrollTop) {
            // yes we are heading down...
            Session.set("websiteLimit", Session.get("websiteLimit") + 4);
        }

        lastScrollTop = scrollTop;
    }


});

/// accounts config
Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});
