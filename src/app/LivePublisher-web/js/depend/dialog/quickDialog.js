define(function(require, exports, module) {
    'use strict';
    // require('./ui-dialog.css');
    require('./dialog-plus');

    module.exports = {
        alert: function(content, callback) {
            window.dialog({
                fixed: true,
                cssUri: '',
                title: '提示',
                content: content || '',
                width: 360,
                showHeader: true,
                showIcon: false,
                ok: true,
                okValue: '确定',
                onclose: callback || function() {}
            }).showModal();
        },
        confirm: function (data) {
            window.dialog({
                fixed: true,
                width:330,
                title: '提示',
                showHeader: true,
                showIcon: false,
                content: typeof data === 'string' ? data : (data.content || ''),
                okValue: data.okValue,
                ok: data.ok,
                cancelValue: data.cancelValue,
                cancel: data.cancel
            }).show();
        }
    };
});
