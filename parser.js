var parseUtils = function () {
    this.dom = require('xmldom').DOMParser;
    this.xp = require('xpath');

}

parseUtils.prototype.node_array_text = function(path) {
    var nodes = this.xp.select(path + '/text()', this.doc);
    var result = nodes.map(String);
    return result;
};

parseUtils.prototype.node_text = function(path) {
    var query = path + '//text()';
    var nodes = this.xp.select(query, this.doc);
    return nodes.join('');
};

parseUtils.prototype.node_raw = function(path) {
    reps = [{ from:'<bold>', to: '<b>'},
            { from:'</bold>', to: '</b>'},
            { from:'<italic>', to: '<em>'},
            { from:'</italic>', to: '</em>'}];


    var query = path + '/node()';
    var raw = this.xp.select(query, this.doc).join('');

    var arrayLength = reps.length;
    for (var i = 0; i < arrayLength; i++) {
        raw = raw.replace(reps[i].from, reps[i].to);
    }
    return raw;
};

parseUtils.prototype.build_aff = function(node) {

    var dept = this.xp.select1('institution[@content-type="dept"]/text()', node);
    var inst = this.xp.select1('institution[not(@content-type="dept")]/text()', node);
    var city = this.xp.select1('addr-line[@content-type="city"]/text()', node);
    var prov = this.xp.select1('addr-line[@content-type="state"]/text()', node);
    var country = this.xp.select1('country/text()', node);

    var result = {};
    if (typeof dept !== 'undefined') result.dept = dept.data;
    if (typeof inst !== 'undefined') result.institute = inst.data;
    if (typeof city !== 'undefined') result.city = city.data;
    if (typeof prov !== 'undefined') result.province = prov.data;
    if (typeof country !== 'undefined') result.country = country.data;
    return result;

};

parseUtils.prototype.add_affiliations = function(auth_node, author) {
    var aff_nodes = this.xp.select('xref[@ref-type="aff"]/@rid', auth_node);

    aff_list = [];
    for (var i=0;i<aff_nodes.length; i++) {
        var node = aff_nodes[i];
        var item = this.xp.select1("//article-meta/aff[@id='" + node.value + "']", this.doc);
        aff_list.push(this.build_aff(item));
    }

    author.affs = aff_list;
};

parseUtils.prototype.add_mail = function(auth_node, author) {
    var corr = this.xp.select1('xref[@ref-type="corresp"]/@rid', auth_node);
    if (typeof corr !== 'undefined') {
        var address = this.xp.select1("//author-notes/corresp[@id='" + corr.value + "']/email/text()", corr)
        if (typeof address !== 'undefined') {
            author.email = address.data;
        }
    }
};

parseUtils.prototype.author_array = function() {
    authors = [];
    var authorsQuery = "//contrib-group/contrib[@contrib-type='author' or @contrib-type='corresponding-author']";
    var nodes = this.xp.select(authorsQuery, this.doc);
    for (var i=0;i<nodes.length; i++) {
        var node = nodes[i];
        var name = {
            "surname": this.xp.select1('name/surname/text()', node).data,
            "givenName": this.xp.select1('name/given-names/text()', node).data
        };
        this.add_affiliations(node, name);
        this.add_mail(node, name);
        authors.push(name);
    }
    return authors;
};

parseUtils.prototype.newArticle = function(content) {
    this.doc = new this.dom().parseFromString(content);

    var article = {"journal_tag": 'elementa', "state": 'parsed', "loc": 'staged'};
    var xp = this.xp;
    var doc = this.doc;

    article.authors = this.author_array();

    article.title = this.node_text('/article/front/article-meta/title-group/article-title');
    article.publisher = this.node_text('/article/front/journal-meta/journal-id[@journal-id-type="publisher-id"]');
    article.doi = this.node_text('/article/front/article-meta/article-id[@pub-id-type="doi"]');
    article.journal_abbr = this.node_text('/article/front/journal-meta/journal-title-group/abbrev-journal-title');
    article.volume = this.node_text('/article/front/article-meta/volume[@content-type="volume"]');
    article.eloc = this.node_text('/article/front/article-meta/elocation-id');
    article.issn = this.node_text('/article/front/journal-meta/issn[@pub-type="epub"]');

    article.anum = parseInt(article.eloc, 10);
    article.issue = '1';

    var title =  this.node_text('/article/front/journal-meta/journal-title-group/journal-title');
    var sub =  this.node_text('/article/front/journal-meta/journal-title-group/journal-subtitle');
    article.journal = title + ': ' + sub;

    article.article_type = this.node_text('/article/front/article-meta/article-categories/subj-group[@subj-group-type="article-type"]/subject');

    /* must do larger work for these */
    article.html_title = this.node_raw('/article/front/article-meta/title-group/article-title');

    var date_node = this.xp.select('/article/front/article-meta/pub-date[@pub-type="epub"]/@iso-8601-date', this.doc);
    if (date_node.length > 0) {
        article.pub_date =  new Date(date_node[0].value).getTime();
    }

    article.domains= this.node_array_text('/article/front/article-meta/article-categories/subj-group[@subj-group-type="domain"]/subject');

    article.copyright = 'STUB_lib';

    return article;

};

module.exports = new parseUtils();
