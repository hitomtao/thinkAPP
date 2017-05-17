<?php
/**
 * Created by PhpStorm.
 * User: gadflybsd
 * Date: 2017/2/8
 * Time: 16:47
 */

namespace Dji\Model;


class ClassifyModel extends CommonModel{
	public function lists(){
		return $this->curd(array(
			'type'		=> 'select',
			'where'		=> 'status=1',
			'msg'		=> '成功获取奖惩分类数据！',
		));
	}
	
	public function add($param){
		$validate = array(
			array('label', 'require', '奖惩分类名称必须填写！'),
			array('displayorder', 'require', '奖惩分类显示顺序必须填写！'),
		);
		return $this->curd(array(
			'validate'	=> $validate,
			'type'		=> 'add',
			'data'		=> $param['data'],
			'msg'		=> '奖惩分类数据添加成功！'
		));
	}
}