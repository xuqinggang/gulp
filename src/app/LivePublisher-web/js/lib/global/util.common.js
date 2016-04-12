'use strict';
module.exports = {
    /**
     * 视差动画
     * @param {Object} $ele 需要动画的元素
     * @return {void}
     */
    parallaxScroll: function($ele) {
        var $window = $(window),
            offsetCoords = $ele.offset(),
            topOffset = offsetCoords.top,
            boxHeight = $ele.outerHeight(),
            bgHeight = $ele.data('bgheight'),
            maxOffset;
        if (bgHeight) {
            maxOffset = bgHeight > boxHeight ? bgHeight - boxHeight : 0;
        }
        if ($window.scrollTop() + $window.height() > topOffset + boxHeight / 2 && topOffset + boxHeight > $window.scrollTop()) {
            var yPos = -(($window.scrollTop() + $window.height() - topOffset) / $ele.data('speed')),
                yCoord =
                yPos,
                coords;
            if (maxOffset >= 0) {
                yCoord = Math.abs(yPos) < maxOffset ? yPos : -maxOffset;
            }
            coords = '50% ' + yCoord + 'px';
            $ele.css({
                backgroundPosition: coords,
                transition: 'background-position 0.4s linear'
            });
        }
    },
    scrollToScreenCenter: function($ele) {
        var $eleHight = $ele.outerHeight(),
            screenHeight = $(window).height(),
            $eleToTop = $ele.offset().top,
            $eleToCenter = $eleToTop - screenHeight / 2 + $eleHight / 2;
        $('html,body').animate({
            scrollTop: $eleToCenter
        }, 1000);
    }
};
