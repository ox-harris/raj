<?php
include __DIR__.'/../RaysConfig.php';
class RaysMediaOps
{
	public $conn;
	
	public $DB_NAME;
	public $TBL_PRFX;
	
	public function __construct() {
		$this->DB_NAME = RaysConfig::DB_PREFIX.RaysConfig::DB_NAME;
		$this->TBL_PRFX = RaysConfig::TABLE_PREFIX;

		$this->conn = mysqli_connect(RaysConfig::DB_SERVER, RaysConfig::DB_USER, RaysConfig::DB_PASSWORD);
		mysqli_select_db($this->conn, $this->DB_NAME);
	}
	
	
	public function show404() {
		header("HTTP/1.0 404 Not Found");
	}
	
	
	public function showMedia() {
		// Define vars
		$media_id = !empty($_REQUEST['id']) ? $_REQUEST['id'] : 0;
		$media_type = !empty($_REQUEST['media_type']) ? $_REQUEST['media_type'] : 'img';
		$media_resolution = !empty($_REQUEST['res']) ? $_REQUEST['res'] : 'uri';
		
		if (!$media_id) {
			return $this->show404();
		}
		
		// Get media
		$result = mysqli_query($this->conn, 'SELECT ntve_file.uri, ntve_file.q1, ntve_file.q2, ntve_file.q3, ntve_file.t1, ntve_file.t2, ntve_file.t3, ntve_file.type_mime 
		FROM '.$this->TBL_PRFX.'ntve_file AS ntve_file 
		WHERE ntve_file.id = '.(int)$media_id);
		if (!$result) {
			//echo mysqli_error($this->conn);
			return $this->show404();
		}
		
		while($row = mysqli_fetch_assoc($result)) {
			if (is_readable(RaysConfig::UPLOADS_DIR.'/'.$row[$media_resolution])) {
				header("Pragma: public");
				header("Cache-Control: max-age=86400");
				header("Expires: ".gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
				header("Content-type: ".$row['type_mime']);
				readfile(RaysConfig::UPLOADS_DIR.'/'.$row[$media_resolution]);
			}
			exit;
		}
	}
}

// Run
$RaysMediaOps = new RaysMediaOps;
$RaysMediaOps->showMedia();
