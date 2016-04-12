/*global $*/
define(function(require, exports, module) {
    'use strict';
    // var urls = require('../global/urlMap'),
        var util = require('../../lib/global/util.common.js'),
            popup = require('../../lib/dialog/quickDialog'),
            service,
            validator;

    require('../../lib/validate/jquery.validate.min');

    service = {
        initValidate: function() {
            validator = $('#formForget').validate({
                rules: {
                    email: {
                        required: true
                    },
                    captcha: {
                        required: true
                    }
                },
                messages: {
                    email: {
                        required: '请输入邮箱',
                        email: '邮箱格式有误'
                    },
                    captcha: {
                        required: '请输入验证码'
                    }
                }
            });
        },
        initEvent: function() {
            $('#formForget').on('submit', function(e) {
                if (validator && validator.form()) {
                    $.ajax({
                        type: 'post',
                        url: $('#formForget').attr('action'),
                        data: JSON.stringify({
                            email: $('#regEmail').val(),
                            captcha: $('#captcha').val()
                        }),
                        contentType: 'application/json',
                        dataType: 'json',
                        success: function(data, s, xhr) {
                            if (data.code === 200) {
                                location.href = urls.forgetStep2;
                            } else {
                                //popup.alert(data.msg || '操作失败');
                                if(data.code === 402){
                                    util.showTip($('#captcha'), data.msg);
                                    $('#captcha').focus();
                                } else {
                                    popup.alert(data.msg || '操作失败');
                                }
                            }
                        },
                        error: function(xhr, s, err) {
                            var data;
                            try {
                                data = JSON.parse(xhr.responseText);
                            } catch(e) {
                                data = {
                                    code: 400,
                                    msg: '操作失败'
                                };
                            }
                            if(data.code === 402){
                                util.showTip($('#captcha'), data.msg);
                                $('#captcha').focus();
                            } else {
                                popup.alert(data.msg || '操作失败');
                            }
                            return false;
                        }
                    });
                } else {
                    $('#formForget').find('.error:eq(0)').focus();
                }
                return false;
            });
            $('#captchaImg').on('click', function(e){
                var url = $(this).attr('src');
                $(this).attr('src', url.split('?')[0] + '?r=' + Math.random());
                return false;
            });
        },
        init: function() {
            util.initValidate();
            service.initValidate();
            service.initEvent();
        }
    };

    $(service.init);
});
