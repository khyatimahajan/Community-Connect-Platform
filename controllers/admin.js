const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./../model/User');
const Group = require('./../model/Group');
const validation = require('./../validation');

module.exports.getLogin = (req, res, next) => {
    res.render('../views/admin/login', {
        pageTitle: "Admin login",
        form: req.flash('form'),
        message: req.flash('message')
    });
}

module.exports.postLogin = async (req, res, next) => {
    const { email, password } = req.body;

    const validationResult = validation.loginValidation(req.body);
    if (validationResult.error) {
        req.flash('message', validationResult.error.details[0].message)
        req.flash('form', req.body)
        return res.redirect('login')
    }
    let user = await User.findOne({ email: email });
    if (!user) {
        req.flash('message', "Invalid credentials")
        req.flash('form', req.body)
        return res.redirect('login');

    }
    let isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch)
    if (isMatch) {
        req.session.user = user;
        req.session.isLoggedIn = true;
        return res.redirect('dashboard')
    } else {
        req.flash('message', "Invalid credentials")
        req.flash('form', req.body)
        return res.redirect('login');
    }
}

module.exports.getDashboard = async (req, res, next) => {

    try {
        let allusers = await User.find({
            isAdmin: false
        });

        let users = []
        allusers.map(user => {
            users.push({ 'id': user._id, 'value': user.name });
        });

        let groups = await Group.find().populate('members');

        return res.render('./../views/admin/dashboard', {
            pageTitle: "Admin Dashboard",
            user: req.user,
            groups,
            users: JSON.stringify(users),
            allusers,
            groupMessage: req.flash('groupMessage')
        });

    } catch (err) {
        console.log(err);
        let error = new Error("Something went wrong");
        next(error);
    }
}

module.exports.postAddGroup = async (req, res, next) => {

    var { groupName, members } = req.body;

    members = JSON.parse(members);

    var users = [];

    members.forEach((member, index, array) => {

        let currentUser = User.findById(member.id)
        if (member._id != currentUser._id) {
            currentUser.connection.name.push(member._id);
        }

        users.push(member.id);
    })

    var itemsProcessed = 0;

    const promises = users.map(async (user, index, array) => {
        let currentUserId = users[index];
        let currentUser = await User.findById(currentUserId);

        users.map(async (user) => {
            if (user != currentUser._id) {

                if (!currentUser.connection.name.includes(mongoose.Types.ObjectId(user))) {
                    currentUser.connection.name.push(mongoose.Types.ObjectId(user));
                    await currentUser.save();
                }
                itemsProcessed++;
                if (itemsProcessed === array.length) {
                    callback();
                }
            }
        })
    });


    function callback() {
        let group = new Group({
            name: groupName,
            members: users
        });
        group.save()
            .then(() => {
                req.flash('groupMessage', "Group added successfully");
                return res.redirect('dashboard');
            })
            .catch(err => {
                req.flash('groupMessage', "Something has went wrong");
                return res.redirect('dashboard');
            })
    }
}

module.exports.getGroup = async (req, res, next) => {
    let id = req.params.id;
    try {
        let users = await User.find({
            isAdmin: false
        });

        let allusers = await User.find({
            isAdmin: false
        });

        let group = await Group.findById(id).populate('members');

        group.members.map(member => {
            let res = false;
            users = users.filter(user => {
                if (user._id.toString() != member._id.toString()) {
                    res = true;
                } else {
                    res = false;
                }
                return res;
            });
        });

        let nonGroupUser = []

        users.map(user => {
            nonGroupUser.push({ 'id': user._id, 'value': user.name });
        });

        res.render('./../views/admin/group', {
            group,
            pageTitle: `${group.name} Group | Group`,
            user: req.user,
            allusers,
            users: JSON.stringify(nonGroupUser),
            memberMessage: req.flash('memberMessage')
        });

    } catch (error) {
        req.flash('groupMessage', "Something has went wrong");
        return res.redirect('/admin/dashboard');
    }
}

module.exports.addGroupMember = async (req, res, next) => {
    let { group_id, members } = req.body;

    members = JSON.parse(members);

    let group = await Group.findById(group_id)

    var users = group.members;

    members.forEach((member, index, array) => {
        users.push(member.id);
    });

    var itemsProcessed = 0;

    users.map(async (user, index, array) => {
        let currentUserId = users[index];
        let currentUser = await User.findById(currentUserId);

        users.map(async (user) => {
            if (user != currentUser._id) {
                if ((!currentUser.connection.name.includes(user))) {

                    if (JSON.stringify(user) != JSON.stringify(currentUser._id)) {
                        currentUser.connection.name.push(mongoose.Types.ObjectId(user));
                        await currentUser.save();
                    }
                }
                itemsProcessed++;
                if (itemsProcessed === array.length) {
                    callback();
                }
            }
        })
    });

    function callback() {
        group.members = users;
        group.save()
            .then(() => {
                req.flash('memberMessage', "Group member added successfully");
                return res.redirect(`/admin/group/${group_id}`);
            })
            .catch(err => {
                req.flash('memberMessage', "Something has went wrong");
                return res.redirect(`/admin/group/${group_id}`);
            })
    }
}

module.exports.postGroupDelete = async (req, res, next) => {

    let groupId = req.body.group_id;

    try {
        let group = await Group.findByIdAndDelete(groupId);

        let users = group.members;

        var itemsProcessed = 0;

        users.map(async (user, index, array) => {
            let currentUserId = users[index];
            let currentUser = await User.findById(currentUserId);

            users.map(async (user) => {
                if (user != currentUser._id) {
                    let userIndex = currentUser.connection.name.findIndex(conn => {
                        JSON.stringify(conn) != JSON.stringify(user)
                    })
                    currentUser.connection.name.splice(userIndex, 1);
                    await currentUser.save();
                    itemsProcessed++;
                    if (itemsProcessed === array.length) {
                        callback();
                    }
                }
            })
        });

        function callback() {
            req.flash('groupMessage', "Group deleted successfully");
            return res.redirect('/admin/dashboard');
        }

    } catch (error) {
        console.log(error)
        req.flash('groupMessage', "Something has went wrong");
        return res.redirect('/admin/dashboard');
    }
}

module.exports.postGroupMemberDelete = async (req, res, next) => {
    let { member_id, group_id } = req.body;

    try {
        let group = await Group.findById(group_id);
        var itemsProcessed = 0;
        group.members.map(async (member, index, array) => {
            let currentUser = await User.findById(member);
            let userIndex = currentUser.connection.name.findIndex(conn => {
                JSON.stringify(conn) == JSON.stringify(member_id)
            })
            currentUser.connection.name.splice(userIndex, 1);
            await currentUser.save();
            itemsProcessed++;
            if (itemsProcessed === array.length) {
                callback();
            }
        });

        async function callback() {
            let members = group.members.filter(member => {
                return member._id != member_id;
            });
            group.members = members;
            await group.save();
            req.flash('memberMessage', "Member deleted successfully from this group");
            return res.redirect(`/admin/group/${group_id}`);
        }

    } catch (error) {
        console.log(error);
        req.flash('memberMessage', "Something has went wrong");
        return res.redirect(`/admin/group/${group_id}`);
    }

}

module.exports.getLogout = (req, res, next) => {
    req.session.destroy();
    return res.redirect('login');
}