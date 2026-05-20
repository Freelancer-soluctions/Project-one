# Field Limits Configuration Specification

## Overview

This specification defines the field limits configuration for shadcn UI components in the client application.

## Field Limits by Module

### Users Module
- name: maxLength 100
- email: maxLength 254
- password: maxLength 100
- address: maxLength 250
- city: maxLength 35
- document: maxLength 128
- socialSecurity: maxLength 128
- state: maxLength 50
- telephone: maxLength 15
- zipcode: maxLength 9

### Notes Module
- title: maxLength 50
- content: maxLength 2000
- color: maxLength 6

### NoteColumns Module
- title: maxLength 15
- code: maxLength 3

### News Module
- description: maxLength 400

### Events Module
- title: maxLength 50
- description: maxLength 200
- speaker: maxLength 20
- startTime: maxLength 5
- endTime: maxLength 5

### Products Module
- sku: maxLength 16
- name: maxLength 80
- description: maxLength 2000
- barCode: maxLength 25

### ProductCategories Module
- code: maxLength 3
- description: maxLength 50

### ProductProviders Module
- code: maxLength 3
- name: maxLength 100
- contactName: maxLength 60
- contactEmail: maxLength 80
- contactPhone: maxLength 15
- address: maxLength 120

### ProductAttributes Module
- name: maxLength 50
- description: maxLength 100

### Warehouse Module
- name: maxLength 50
- description: maxLength 120
- address: maxLength 120

### Stock Module
- lot: maxLength 50

### InventoryMovement Module
- reason: maxLength 200

### Clients Module
- name: maxLength 100
- email: maxLength 100
- phone: maxLength 15
- address: maxLength 120

### Employees Module
- name: maxLength 100
- lastName: maxLength 100
- dni: maxLength 128
- phone: maxLength 15
- email: maxLength 100
- address: maxLength 120
- position: maxLength 100
- department: maxLength 100
- salary: maxLength 128

### Payroll Module
- baseSalary: maxLength 128
- extraHours: maxLength 128
- deductions: maxLength 128
- totalPayment: maxLength 128

### PerformanceEvaluation Module
- comments: maxLength 200

### Permission Module
- type: maxLength 100