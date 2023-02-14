"use strict";
/**
 * Core Object
 */
var Reponse = (function () {
    /**
     * Constructor
     */
    function Reponse() {
        this.step = null;
        this.status = null;
        this.data = null;
    }
    /**
     * Response Success
     */
    Reponse.prototype.Resolve = function (data) {
        this.status = 'Completed';
        this.data = data;
        return this;
    }
    /**
     * Response Failure
     */
    Reponse.prototype.Reject = function (data) {
        this.status = 'Failed';
        this.data = data;
        return this;
    }
    Reponse.prototype.Error = function () {
        return this.status == 'Failed';
    }
    /**
     * EOF
     */
    return Reponse;
})();
module.exports = Reponse;