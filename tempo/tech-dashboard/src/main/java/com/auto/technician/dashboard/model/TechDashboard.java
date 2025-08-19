//package com.auto.technician.dashboard.model;
//
//import jakarta.persistence.Entity;
//import jakarta.persistence.GeneratedValue;
//import jakarta.persistence.GenerationType;
//import jakarta.persistence.Id;
//import jakarta.persistence.Table;
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
////@Entity
//@AllArgsConstructor
//@NoArgsConstructor
//@Data
//@Table(name="Technician_Dashboard")
//public class TechDashboard {
//	
//	@Id
//	@GeneratedValue(strategy = GenerationType.IDENTITY)
//	private Long id;
//	
//	
//	private String name;
//	private String email;
//	//above three from Technician service 
//	
//	//will use the taskId to pull the tasks i mean accepted task info based on taskid will display complete task info here. 
//	private String taskId;
//	private String TaskStatus; //that way he will come to know current status and then will be able to update it. // lets see if we can have pass 
//	// it state [ incase if he is not able to do then he can pass it then the task will be in open state which other can pick
//	// status is enum in posting class so check type here. 
//
//	
//	private int tatalActiveTasks;
//	private int completedTasks;
//	private int cancelledTask;
//	
//	//after task completion dealer can give feedback //on status change to completed cancelled 
//	private String feedback;
//	private String rating;
//	
//	
//
//
//}
