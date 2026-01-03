/**
 * Application Event System - Robust event handling with late registration support
 *
 * Key feature: If you register a handler after an event has already fired,
 * your handler runs immediately. This prevents race conditions during app initialization.
 */

window.AppEvents = (function() {
    'use strict';

    // Track all registered events and their state
    const events = {};

    /**
     * Create a new event tracker
     * @private
     */
    function createEvent(eventName) {
        events[eventName] = {
            fired: false,
            callbacks: [],
            data: null  // Store event data for late subscribers
        };
    }

    /**
     * Register a callback for an event
     * If the event already fired, the callback runs immediately
     *
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event fires
     *
     * @example
     * AppEvents.on('initializationComplete', function() {
     *     console.log('App is ready!');
     * });
     */
    function on(eventName, callback) {
        if (typeof callback !== 'function') {
            console.error(`AppEvents.on: callback must be a function for event "${eventName}"`);
            return;
        }

        // Create event tracker if it doesn't exist
        if (!events[eventName]) {
            createEvent(eventName);
        }

        const event = events[eventName];

        if (event.fired) {
            // Event already fired - call the callback immediately with stored data
            console.log(`AppEvents: Late registration for "${eventName}" - calling immediately`);
            try {
                callback(event.data);
            } catch (error) {
                console.error(`AppEvents: Error in late callback for "${eventName}":`, error);
            }
        } else {
            // Event hasn't fired yet - queue the callback
            event.callbacks.push(callback);
        }
    }

    /**
     * Trigger an event, calling all registered callbacks
     * Can only be triggered once - subsequent calls are ignored
     *
     * @param {string} eventName - Name of the event to trigger
     * @param {*} data - Optional data to pass to callbacks
     *
     * @example
     * AppEvents.trigger('initializationComplete');
     * AppEvents.trigger('dataLoaded', { count: 42 });
     */
    function trigger(eventName, data) {
        // Create event tracker if it doesn't exist
        if (!events[eventName]) {
            createEvent(eventName);
        }

        const event = events[eventName];

        if (event.fired) {
            console.warn(`AppEvents: Event "${eventName}" already fired - ignoring duplicate trigger`);
            return;
        }

        console.log(`AppEvents: Triggering "${eventName}" for ${event.callbacks.length} callback(s)`);

        // Mark as fired and store data for late subscribers
        event.fired = true;
        event.data = data;

        // Call all queued callbacks
        event.callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`AppEvents: Error in callback for "${eventName}":`, error);
            }
        });

        // Clear callbacks after firing (they're no longer needed)
        event.callbacks = [];
    }

    /**
     * Check if an event has already fired
     *
     * @param {string} eventName - Name of the event to check
     * @returns {boolean} True if event has fired
     */
    function hasFired(eventName) {
        return events[eventName] && events[eventName].fired;
    }

    /**
     * Reset an event (useful for testing)
     * @private
     */
    function reset(eventName) {
        if (events[eventName]) {
            events[eventName].fired = false;
            events[eventName].callbacks = [];
            events[eventName].data = null;
        }
    }

    // Public API
    return {
        on,
        trigger,
        hasFired,
        reset  // Expose for debugging/testing only
    };

})();
