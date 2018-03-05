

!function(factory,$,global){
    
    if(global == null)retrun;
    if($ == null || typeof $ !== 'function')return;
    if(typeof define == 'function' && typeof define.amd == 'object'){
        define(factory);
        return;
    }
    factory(global);

}(function(global){

    var defaults = SearchInput.prototype.defaults = {
        el:null,
        data:[],
        isIndex:true,
        listFieldName:'text',
        paramFieldName:'name',
        successCb:null,
        errorCb:null,
        dataType:'json',
        maxHeight:200,
        selectCd:null,
        noMoreDataFn:noMoreDataFn,
        toggleClass:null,
        acync:false,
        param:{
            pageSize:0,
            pageNo:0,
            total:0
        }
    }

    function noMoreDataFn(data){
        if(Math.ceil(data.total/data.pageSize)<=data.pageNo){
            return true;
        }else{
            return false;
        }
    }
    
    function SearchInput(option){
        if(this instanceof SearchInput !== true){
            return new SearchInput(option);
        }
        this.option = $.extend({},defaults,option);
        this.param = this.option.param||defaults.param;
        this.$el = this.option.el || $('[input-search]');
        this.data = this.option.data;
        this.$panel = null;
        this.$list = null;
        this.$noDataTip = null;
        this.$moreData = null;
        this.$backdrop = null;
        this.$parent = this.$el.parent();
        this.init();
    }

    SearchInput.prototype.init = function(){
        this.createPanel();
        this.$panel = this.$el.siblings('.search-input').css(this.getPosition());
        this.$list = this.$panel.find('.search-results');
        this.$noDataTip = this.$panel.find('.no-search-data');
        this.$backdrop = this.$panel.find('.search-backdrop');
        this.$moreData = this.$panel.find('.load-more-data');
        this.initPanelEvent();
        this.initListEvent();
    }
    
    SearchInput.prototype.getPosition = function(){
        this.$parent.css('position','relative');
        var marginTop = parseInt(this.$el.css('margin-top'));
        var top = this.$el.offset().top;
        top -= this.$parent.offset().top;
        top += this.$el.outerHeight();
        var width = this.$el.outerWidth();
        return {
            top:top,
            width:width,
            'max-height':this.option.maxHeight
        }
    }

    SearchInput.prototype.createPanel = function(){
        var hasData = this.data && !!this.data.length;
        var html = '<div class="search-input"><div class="search-backdrop"></div><ul class="search-results" '+ (!hasData ? 'style="display:none"' : '') +'>';
        if(hasData){
            html += this.createResult();
        }
        html += '</ul><div class="no-search-data"'+ (hasData ? 'style="display:none"': '')+'><i></i><span>暂无数据</span></div><div class="load-more-data" '+ (!hasData || !this.option.acync ? 'style="display:none"': '')+'><i></i><span>加载更多</span></div></div>';
        
        this.$parent.append($(html));
    }

    SearchInput.prototype.createResult = function(data){
        data = data || this.data;
        if(!data || data instanceof Array !== true || !data.length)return '';
        var html = '',name = this.option.listFieldName;
        for(var i = 0,len = data.length;i<len;i++){
            html += "<li><span>" + (this.option.isIndex ? data[i] : data[i][name]) + "</span></li>";
        }
        return html;
    }
    
    SearchInput.prototype.initPanelEvent = function(){
        var that = this;
        var toggleClass = that.option.toggleClass;
        this.$el.on('focus',function(e){
            var event = e || window.event;
            event.stopPropagation();
            toggleClass ? that.$panel.addClass(toggleClass) : that.$panel.show();
        });
        
        this.$el.on('keyup',function(e){
            var val = $(this).val();
            var param = {};
            param[that.option.paramFieldName] = val;
            that.search(param);
        })

        this.$backdrop.on('click',function(e){
            toggleClass ? that.$panel.removeClass(toggleClass) : that.$panel.hide();
        });

        this.$moreData.on('click',function(e){
            var val = $(this).val();
            var param = {};
            param[that.option.paramFieldName] = val;
            that.search(param);
        });
    }

    SearchInput.prototype.search = function(param){
        var that = this;
        var option = this.option;
        var url = option.url;
        var param = $.extend(this.param,param);
        $.post(url,param,option.dataType).done(function(data,textStatus,jqXHR){
            that.packParam(data);
            that.add(data);
            that.toggleTip(data);
            option.successCb && option.successCb.apply(that,Array.prototype.slice.call(arguments));
        }).fail(function(){
            that.packParam(data);
            that.add([]);
            that.toggleTip(data);
            option.errorCb && option.errorCb.call(that,Array.prototype.slice.call(arguments));
        });
    }

    SearchInput.prototype.packParam = function(res){
        var param = this.param;
        for(var i in param){
            if(res[i])param[i] = res[i];
        }
    }
    
    SearchInput.prototype.toggleTip = function(result){
        var noMoreDataFn = this.option.noMoreDataFn;
        var res = noMoreDataFn(result);
        this.toggleTipFn(res);
    }

    SearchInput.prototype.toggleTipFn = function(flag){
        if(flag){
            this.$noDataTip.show();
            this.$moreData.hide();
        }else{
            this.$noDataTip.hide();
            this.$moreData.show();
        }
    }

    SearchInput.prototype.initListEvent = function(){
        var $li = this.$list.find('li');
        $li.off('click').on('click',this.select());
    }
    
    SearchInput.prototype.select = function(){
        var that = this;
        return function(e){
            var children = this.children || this.childNodes;
            var value = children[0].textContent;
            that.$el.val(value);
            that.option.selectCd && that.option.selectCd.call(that,value);
            that.$panel.hide();
        }
    }

    SearchInput.prototype.refresh = function(data){
        if(!data || data.length<1)return;
        this.data = data;
        var html = this.createResult(data);
        this.$ul.show().html(html);
        this.initListEvent();
        if(!this.option.acync){
            this.data && this.data.length ? this.$noDataTip.hide() :this.$noDataTip.show();
        }
    }

    SearchInput.prototype.add = function(data){
        if(!data || data.length<1)return;
        this.data = this.data.concat(data);
        var html = this.createResult(data);
        this.$list.show().append($(html));
        this.initListEvent();
        if(!this.option.acync){
            this.data && this.data.length ? this.$noDataTip.hide() :this.$noDataTip.show();
        }
    }

    return global.SearchInput = SearchInput;

},window.jQuery,window);