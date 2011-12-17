define(function (require, exports, module) {

    // Dependencies
    var widgets      = require('dwf/widgets');
    var util         = require('dwf/util');
    var transactions = require('dwf/transactions');
    var ControlPanel = require('dwf/views/control-panel').ControlPanel;
    var FormPreview  = require('dwf/views/form-preview').FormPreview;
    var Messages     = require('dwf/views/messages').Messages;
    var Form         = require('dwf/models/form').Form;

    // Models
    var form = new Form(JSON.parse($('#initial-form')[0].textContent));

    // Views
    var controlPanel = new ControlPanel();
    var formPreview  = new FormPreview();
    var messages     = new Messages();

    var base = document.getElementById('DWF-base');

    controlPanel.activate(base, {
        addField: function (fieldType, widget) {
            util.prompt("Label:", function (label) {
                if (label) {
                    if (form.getFieldByLabel(label)) {
                        util.prompt("A field with that label already exists. Enter a new one:",
                                    arguments.callee);
                    } else {
                        var f = form.addField(label, fieldType, widget);
                        formPreview.addField(f);
                    }
                }
            });
        },

        activeFieldExists: function () {
            return form.activeField;
        },

        noFieldsExist: function () {
            return !form.hasFields();
        },

        getActiveFieldLabel: function () {
            return form.activeField.label();
        },

        getActiveFieldHelpText: function () {
            return form.activeField.helpText();
        },

        getActiveFieldRequired: function () {
            return form.activeField.required();
        },

        updateActiveFieldLabel: function (val) {
            form.activeField.label(val);
            formPreview.displayActiveFieldLabel(val);
        },

        updateActiveFieldHelpText: function (val) {
            form.activeField.helpText(val);
            formPreview.displayActiveFieldHelpText(val);
        },

        updateActiveFieldRequired: function (val) {
            form.activeField.required(val);
            formPreview.displayActiveFieldRequired(val);
        },

        getFormName: function () {
            return form.name();
        },

        getFormDescription: function () {
            return form.description();
        },

        updateFormName: function (val) {
            form.name(val);
            formPreview.displayFormName(val);
        },

        updateFormDescription: function (val) {
            form.description(val);
            formPreview.displayFormDescription(val);
        },

        saveNow: util.bind(transactions.saveNow, transactions)
    });

    formPreview.activate(base, {
        activateField: function (label) {
            form.activeField = form.getFieldByLabel(label);
            controlPanel.openFieldSettingsTab();
        },

        deleteField: function (label) {
            form.deleteField(label);
        },

        deleteActiveField: function (label) {
            controlPanel.openFormSettingsTab();
            form.deleteField(label);
        }
    });

    // Have the form preview display the initial form data.
    formPreview.displayFormName(form.name());
    formPreview.displayFormDescription(form.description());
    form.eachField(function (field, i) {
        formPreview.addField(field);
    });

    messages.activate(document.body);

    // Start saving the form about once every minute.
    transactions.startAutoSaveLoop((function () {
        var msgId;

        return {
            target: document.getElementById('save-target').textContent,
            formId: form.id(),
            preSave: function () {
                controlPanel.disableSave();
                msgId = messages.info('Saving...');
            },
            postSave: function () {
                controlPanel.enableSave();
                messages.removeMessage(msgId);
                var d = new Date();
                messages.success('Successfully saved at '
                                 + ((d.getHours() % 12) || 12)
                                 + ':' + d.getMinutes());
            },
            error: function () {
                controlPanel.enableSave();
                messages.removeMessage(msgId);
                messages.error('There was an error saving.');
            }
        };
    }()));
});
