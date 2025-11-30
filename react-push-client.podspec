require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-push-client"
  s.version      = package["version"]
  s.summary      = "React Native client library for ReactPush update system"
  s.description  = <<-DESC
                  React Native client library for ReactPush update system
                   DESC
  s.homepage     = "https://github.com/your-org/react-push"
  s.license      = "MIT"
  s.author       = { "author" => "mert.yildiz3@outlook.com" }
  s.platforms    = { :ios => "15.0" }
  s.source       = { :git => "https://github.com/your-org/react-push.git", :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m}"
  s.public_header_files = "ios/*.h"
  s.requires_arc = true
end

