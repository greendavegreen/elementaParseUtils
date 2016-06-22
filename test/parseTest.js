var assert = require('chai').assert;
var fs = require('fs')
var ap = require ('../parser.js');



describe('parserTest', function() {
    var article;

    before(function() {
        var data = fs.readFileSync('test/elementa.999998.xml', 'utf8');
        article = ap.newArticle(data);
    });

    describe('#newArticle()', function () {
        it('should find HTML tags in html_title', function () {
            assert.equal('What\'s the <b>worst</b> that could happen?', article.html_title);
        });
        it('should find 2 domains', function () {
            assert.deepEqual([ 'Ecology', 'Ocean Science' ], article.domains);
        });
        it('should find pub date', function () {
            assert.equal(new Date("2084-9-28").getTime(), article.pub_date);
        });
        it('should find 1 author', function () {
            assert.deepEqual([ { givenName: "Sølfrid S.",
                                 surname: "Hj&oslash;llo",
                                 "email": "jack.handy@BTT.org",
                                 affs: [

                                     {
                                         "city": "Fairbanks",
                                         "country": "United States",
                                         "institute": "Big Think Tank",
                                         "province": "Alaska"
                                     },{
                                         "city": "White Plains",
                                         "country": "United States",
                                         "dept": "Complaints Department",
                                         "institute": "IBM",
                                         "province": "New York",
                                     }
                                        ]
                               }
                              ], article.authors);
        });
        it('should find title', function () {
            assert.equal('What\'s the worst that could happen?', article.title);
        });
    });

});



