/**
 * A trie implementation for local prefix searching in JavaScript.
 * Copyright (C) 2011 Alex Michael
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

window.console = window.console || {log: function(){;}};

/**
 * TrieNode.
 * @class
 * @property wordEnd {Boolean} Does a word end on this node?
 * @param children {Object} A map of the children of this node.
 * @param data {Object} Data stored at this node, returned with the object in a search result.
 */
var TrieNode = function()
{
    this.wordEnd  = false;
    this.children = {};
    this.data     = {};
};

/**
 * PrefixSearch.
 * @class
 * @param _data {Array} The data to index.
 * @param _index {String} The property to index on.
 */
var PrefixSearch = function(_data, _index)
{
    //
    // Properties.
    //

    var tempData    = _data,
    trie        = new TrieNode(),
    index       = _index,
    dataType    = null,
    numItems    = 0,
    initialized = false;

    //
    // Private API.
    //

    /**
     * Ensures the trie is initialized upon an API call.
     */
    var _ensureInit = function()
    {
        if (!initialized) {
            throw 'Search engine has not been initialized.';
        }
    };

    /**
     * Is it a string?
     */
    var _isString = function(str)
    {
        if (!str) {
            return false;
        }
        var type = typeof str;
        if (type === 'string') {
            return true;
        }
        if (type === 'object') {
            return str.constructor.toString().match(/string/i) !== null; 
        }
        return false;
    };

    /**
     * 's' for strings, 'o' for objects.
     */
    var _getType = function(obj)
    {
        if (!obj || (!_isString(obj) && !isNaN(obj))) {
            throw 'Unsupported type.';
        }
        if (_isString(obj)) {
            return 's';
        } else {
            return 'o';
        }
    };

    /**
     * Recursive insertion.
     * @param node {TrieNode} The current node.
     * @param term {String} The term to store.
     * @param data {Object} Data to store with the term.
     * @returns Void.
     */
    var _insert = function(node, term, data)
    {
        if (term === "") {
            if (!node.wordEnd) {
                numItems++;
            }
            node.wordEnd = true;
            if (data) {
                node.data = data;
            }
            return;
        }
        var ch = term.charAt(0);
        if (!node.children[ch]) {
            node.children[ch] = new TrieNode();
        }
        _insert(node.children[ch], term.substring(1), data);
    };

    /**
     * Builds the trie with initial data. The insertion process
     * does not respect the case of the terms (i.e it is case-insensitive).
     * @returns Void.
     */
    var _build = function()
    {
        if (!tempData) {
            throw 'Undefined data.';
        } 

        dataType = _getType(tempData[0]);
        if (dataType === 'o' && !index) {
            throw 'Undefined index. Please specify a property to index on.';
        }

        var term = null,
        i    = 0,
        l    = tempData.length,
        obj  = null;
        for (i = 0; i < l; ++i) {
            obj = tempData[i];
            if (obj) {
                if (dataType === 'o') {
                    if (!obj.hasOwnProperty(index)) {
                        throw 'Index property does not exist.';
                    }
                    term = obj[index].toLowerCase();
                } else {
                    term = obj.toLowerCase();
                }
                _insert(trie, term, obj);
            }
        }
        initialized = true;
        // Delete data and keep index.
        tempData = null;
    };

    /**
     * Flattens a part of the tree into a list i.e creates a list of 
     * all the nodes containing a word-end from that point down.
     * @param node {TrieNode} The node to flat from.
     */
    var _flatten = function(node)
    {
        if (!node) {
            return [];
        }
        var results = [];
        if (node.wordEnd) {
            results.push(node.data);
        }
        for (var ch in node.children) {
            if (node.children.hasOwnProperty(ch)) {
                var temp = _flatten(node.children[ch]),
                i    = 0,
                l    = temp.length;
                for (i = 0; i < l; i ++) {
                    results.push(temp[i]);
                }
            }
        }
        return results;
    };

    /**
     * Searches (recursively) for all prefix matches of a term.
     * @param node {TrieNode} The current node.
     * @param term {String} The term to search for.
     */
    var _find = function(node, term) 
    {
        if (term === "") {
            return _flatten(node);
        } else {
            var ch = term.charAt(0);
            if (!node.children[ch]) {
                return [];
            } else {
                return _find(node.children[ch], term.substring(1));
            }
        }
    };

    //
    // Public API.
    //

    return {

        // Expose attributes.
        _attrs: {
            trie       : trie,
            dataType   : dataType,
            initialized: initialized
        },

        // Expose private methods through the _ut namespace for unit-testing.
        // These should not be used directly.
        _ut: {
            flatten : _flatten,
            find    : _find,
            insert  : _insert,
            build   : _build,
            getType : _getType,
            isString: _isString
        },

        /**
         * Search for all words having 'term' as a prefix.
         * @param term
         * @returns {Array} List of results, either objects or strings.
         */
        search: function(term)
        {
            _ensureInit();
            if (term === null || term === undefined) {
                throw "Undefined term.";
            }
            if (term === "") {
                return [];
            }
            return _find(trie, term);
        },

        /**
         * Get number of words in the trie.
         * @returns {Number}
         */
        size: function()
        {
            return numItems;
        },

        /**
         * Add a new word (or object) in the trie.
         * @param object {Object} String or object to add.
         * @returns Void.
         */
        add: function(object)
        {
            _ensureInit();
            if (object === null || object === undefined) {
                return;
            }
            var type = _getType(object),
            term = null;
            if (dataType !== type) {
                throw 'Unsupported type.';
            }
            if (dataType === 'o') {
                if (!object.hasOwnProperty(index)) {
                    throw 'Index property does not exist.';
                }
                term = object[index].toLowerCase();
            } else {
                term = object.toLowerCase();
            }
            return _insert(trie, term, object);
        },

        /**
         * Build the trie with the initial data. If the data is too big, then
         * building will be deferred and executed async in a setTimeout so that
         * it does not block the UI.
         * @returns Void.
         */
        build: function()
        {
            if (tempData.length > 50000) {
                console.log("deferred: data size = " + tempData.length);
                window.setTimeout(function() {
                    var start = new Date();
                    _build();
                    console.log("build finished in " + (new Date() - start) + "ms");
                }, 0);
            } else {
                var start = new Date();
                _build();
                console.log("build finished in " + (new Date() - start) + "ms");
            }
            return true;
        }

    };
};