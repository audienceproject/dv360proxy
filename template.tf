variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "invocation_account_ids" {
  type    = list(string)
}
variable "api_credentials_parameter_name" {
  type    = string
  default = "dv360proxy.credentials"
}
variable "config_parameter_name" {
  type    = string
  default = "dv360proxy.config"
}


provider "aws" {
  region = var.aws_region
}


locals {
  function_name = "dv360proxy"
}


data "archive_file" "lambda_package" {
    type          = "zip"
    source_dir    = "dv360proxy/"
    output_path   = "${path.cwd}/.artifacts/lambda_function.zip"
}

resource "aws_lambda_function" "function" {
  function_name    = local.function_name

  role             = aws_iam_role.lambda_role.arn

  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  filename         = data.archive_file.lambda_package.output_path
  handler          = "app.lambdaHandler"

  runtime          = "nodejs16.x"

  timeout          = 300

  environment {
    variables = {
      API_CREDENTIALS_PARAMETER_NAME  = var.api_credentials_parameter_name
      CONFIG_PARAMETER_NAME           = var.config_parameter_name
    }
  }
}

data "aws_iam_policy_document" "logs_policies_data" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
    ]

    resources = [aws_cloudwatch_log_group.lambda_logs.arn]
  }

  statement {
    effect    = "Allow"

    actions   = [
      "logs:PutLogEvents"
    ]

    resources = ["${aws_cloudwatch_log_group.lambda_logs.arn}:*"]
  }
}

resource "aws_iam_role_policy" "logs_policies" {
  name    = "logs"

  policy  = data.aws_iam_policy_document.logs_policies_data.json
  role    = aws_iam_role.lambda_role.id
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "ssm_policies_data" {
  statement {
    effect = "Allow"

    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]

    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.api_credentials_parameter_name}",
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.config_parameter_name}"
    ]
  }

  statement {
    effect    = "Allow"

    actions   = [
      "ssm:DescribeParameters"
    ]

    resources = ["arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"]
  }
}

resource "aws_iam_role_policy" "ssm_policies" {
  name    = "ssm"

  policy  = data.aws_iam_policy_document.ssm_policies_data.json
  role    = aws_iam_role.lambda_role.id
}


data "aws_iam_policy_document" "assume_role_policies_data" {
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "dv360proxy"

  assume_role_policy = data.aws_iam_policy_document.assume_role_policies_data.json
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name = "/aws/lambda/${local.function_name}"

  retention_in_days = 30
}

resource "aws_lambda_permission" "allowed_accounts" {
  for_each = toset(var.invocation_account_ids)

  action        = "lambda:InvokeFunction"

  function_name = aws_lambda_function.function.function_name

  principal     = "arn:aws:iam::${each.key}:root"
}

output "lambda_function_arn" {
  value = aws_lambda_function.function.arn
}