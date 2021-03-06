<?php
/**
 * 检查文件的存在性，远程或是本地文件均可，不必考虑是否禁用了allow_url_open
 * @param $file
 *
 * @return bool
 */
function fileExists($file){
	if(preg_match('/^http:\/\//',$file)){
		if(ini_get('allow_url_fopen')){
			if(@fopen($file,'r')) return true;
		}else{
			$parseurl=parse_url($file);
			$host=$parseurl['host'];
			$path=$parseurl['path'];
			$fp=fsockopen($host,80, $errno, $errstr, 10);
			if(!$fp)return false;
			fputs($fp,"GET {$path} HTTP/1.1 \r\nhost:{$host}\r\n\r\n");
			if(preg_match('/HTTP\/1.1 200/',fgets($fp,1024))) return true;
		}
		return false;
	}
	return file_exists($file);
}
/**
 * 创建目录
 * @param $dir
 *
 * @return bool
 */
function mkdirs($dir){
	if(!is_dir($dir)){
		if(!mkdirs(dirname($dir))){
			return false;
		}
		if(!mkdir($dir,0777)){
			return false;
		}
	}
	return true;
}

/**
 * 删除指定文件
 * @param        $path
 * @param string $fileName
 */
function rmFile($path, $fileName=''){
	$path = preg_replace('/(\/){2,}|{\\\}{1,}/','/',$path);     //去除空格
	$path.= $fileName;      //得到完整目录
	if(is_dir($path)){      //判断此文件是否为一个文件目录
		if ($dh = opendir($path)){      //打开文件
			while (($file = readdir($dh)) != false){        //遍历文件目录名称
				unlink($path.'\\'.$file);       //逐一进行删除
			}
			closedir($dh);      //关闭文件
		}
	}
}

/**
 * 读出文件
 * @param $filename
 *
 * @return string
 */
function rfile($filename){
	$handle = fopen($filename, "r");
	$contents = fread($handle, filesize ($filename));
	fclose($handle);
	return $contents;
}

/**
 * 写入文件
 * @param $filename
 * @param $content
 *
 * @return string
 */
function wfile($filename, $content){
	if (!$handle = fopen($filename, 'w')) {
		return "���ܴ��ļ� $filename";
		exit;
	}
	if (fwrite($handle, $content) === FALSE) {
		return "����д�뵽�ļ� $filename";
		exit;
	}
	return "�ɹ�д�뵽�ļ�$filename";
	fclose($handle);
}

/**
 * 生成随机字符串
 * @param int    $len
 * @param string $chars
 *
 * @return string
 */
function randstr($len=6, $chars='abcdefghijklmnopqrstuvwxyz0123456789'){
	mt_srand((double)microtime()*1000000*getmypid());
	$randstr='';
	while(strlen($randstr)<$len)
		$randstr.=substr($chars,(mt_rand()%strlen($chars)),1);
	return $randstr;
}

/**
 * 驼峰命名法转下划线或减号(-)风格
 * @param $str
 * @return string
 */
function toUnderScore($str, $score='_'){
	$array = array();
	for($i=0;$i<strlen($str);$i++){
		if($str[$i] == strtolower($str[$i])){
			$array[] = $str[$i];
		}else{
			if($i>0){
				$array[] = $score;
			}
			$array[] = strtolower($str[$i]);
		}
	}
	$result = implode('',$array);
	return $result;
}

/**
 * 下划线风格转驼峰命名法
 * @param $str
 * @return string
 */
function toCamelCase($str){
	$array = explode('_', $str);
	$result = '';
	foreach($array as $value){
		$result.= ucfirst($value);
	}
	return $result;
}

//将内容进行UNICODE编码，编码后的内容格式：\u56fe\u7247 （原始：图片）  
function unicode_encode($name){
	$name = iconv('UTF-8', 'UCS-2', $name);
	$len = strlen($name);
	$str = '';
	for ($i = 0; $i < $len - 1; $i = $i + 2)
	{
		$c = $name[$i];
		$c2 = $name[$i + 1];
		if (ord($c) > 0){    // 两个字节的文字  
			$str .= '\u'.base_convert(ord($c), 10, 16).base_convert(ord($c2), 10, 16);
		}else{
			$str .= $c2;
		}
	}
	return $str;
}

// 将UNICODE编码后的内容进行解码，编码后的内容格式：\u56fe\u7247 （原始：图片）  
function unicode_decode($name){
	// 转换编码，将Unicode编码转换成可以浏览的utf-8编码  
	$pattern = '/([\w]+)|(\\\u([\w]{4}))/i';
	preg_match_all($pattern, $name, $matches);
	if (!empty($matches)){
		$name = '';
		for ($j = 0; $j < count($matches[0]); $j++){
			$str = $matches[0][$j];
			if (strpos($str, '\\u') === 0){
				$code = base_convert(substr($str, 2, 2), 16, 10);
				$code2 = base_convert(substr($str, 4), 16, 10);
				$c = chr($code).chr($code2);
				$c = iconv('UCS-2', 'UTF-8', $c);
				$name .= $c;
			}else{
				$name .= $str;
			}
		}
	}
	return $name;
}  