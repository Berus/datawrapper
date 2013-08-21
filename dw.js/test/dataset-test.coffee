
_ = require 'underscore'
vows = require 'vows'
assert = require 'assert'
dw = require '../dw-2.0.js'


columns = [
    dw.column('Party', ['CDU/CSU', 'SPD', 'FDP', 'LINKE', 'GRÜNE']),
    dw.column('Women', [45, 57, 24, 42, 36]),
    dw.column('Men', [192, 89, 69, 34, 32]),
    dw.column('Total', [237, 146, 93, 76, 68]),
];

vows
    .describe('Some basic tests for column API')
    .addBatch

        'test dw.dataset api':
            'topic': dw.dataset(columns)

            'columns': (topic) -> assert.deepEqual topic.columns(), columns
            'numColumns': (topic) -> assert.equal topic.numColumns(), 4
            'numRows': (topic) -> assert.equal topic.numRows(), 5

            'getting column by index': (topic) -> assert.deepEqual topic.column(0), columns[0]
            'getting column by name': (topic) -> assert.deepEqual topic.column('Women'), columns[1]
            'getting unknown column': (topic) -> assert.throws () -> topic.column('Foo')

    .export module