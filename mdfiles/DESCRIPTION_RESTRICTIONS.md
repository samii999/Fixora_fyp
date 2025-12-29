# Description Restrictions & Guidelines for Urgency Detection Model

## Overview
This document outlines the description restrictions and guidelines implemented to improve the accuracy of the urgency detection AI model in the Fixora reporting system.

## Minimum Requirements

### 1. Character Length
- **Minimum**: 30 characters
- **Maximum**: 500 characters
- **Rationale**: Ensures users provide sufficient context for AI analysis

### 2. Content Requirements
Users are guided to include:
- **Severity indicators**: Extent of damage/problem
- **Location specifics**: Where exactly the issue is occurring
- **Safety concerns**: Any potential dangers
- **Impact description**: Effects on surroundings/people

## AI-Guided Quality Scoring

The system now provides real-time feedback on description quality:

### Quality Levels

#### ✅ Excellent (Score: 5-6 points)
**Characteristics:**
- Contains urgency keywords (urgent, emergency, critical, immediate, asap, dangerous, unsafe, hazardous)
- Mentions severity indicators (flooding, blocked, broken, damaged, leaking, overflow, fire, sparking)
- Describes impact (traffic, blocking, affecting, damage, injury, health, safety)

**Example:**
```
🚨 URGENT - Large water main burst flooding Main Street, traffic completely blocked, 
dangerous electrical wires exposed, needs immediate attention
```

#### ✓ Good (Score: 3-4 points)
**Characteristics:**
- Contains 2 out of 3 keyword categories
- Provides clear context

**Example:**
```
Water main leaking badly on 5th Avenue, causing flooding, traffic blocked
```

#### ⚠ Fair (Score: 1-2 points)
**Characteristics:**
- Contains only 1 keyword category
- Missing context for urgency determination

**Example:**
```
Broken water pipe on Main Street
```

#### ⚠ Needs Improvement (Score: 0 points)
**Characteristics:**
- No urgency, severity, or impact indicators
- Too vague for AI analysis

**Example:**
```
There's a problem with the water
```

## Keyword Categories

### Urgency Keywords (Weight: 3 points)
- urgent
- emergency
- critical
- immediate
- asap / as soon as possible
- dangerous
- unsafe
- hazardous
- fast / quickly

### Severity Keywords (Weight: 2 points)
- flooding
- blocked
- broken
- damaged
- leaking
- overflow
- fire
- sparking
- collapsed
- severe
- extensive

### Impact Keywords (Weight: 1 point)
- traffic
- blocking
- affecting
- damage
- injury
- health
- safety
- risk
- hazard

## User Interface Guidance

### Placeholder Example
```
🚨 URGENT - Large water main burst flooding street, traffic blocked, needs immediate attention
```

### Helper Text
```
💡 Tip: Be specific! Include urgency level, extent of damage, and safety concerns.
```

### Real-time Validation
- Shows warning if description < 20 characters
- Provides quality feedback after 30+ characters
- Color-coded feedback:
  - 🟢 Green: Excellent
  - 🔵 Blue: Good
  - 🟡 Yellow: Fair
  - 🟠 Orange: Needs Improvement

## Implementation Benefits

1. **Improved Data Quality**: Standardized descriptions with richer context
2. **Better AI Training**: Consistent data helps train more accurate models
3. **User Education**: Guides users to provide better reports
4. **Real-time Feedback**: Users can improve descriptions before submission
5. **Reduced Ambiguity**: Clear expectations prevent vague reports

## Future Enhancements

### Potential Additions
- Auto-suggest keywords based on selected category
- Template suggestions for common issue types
- Multi-language support for international deployments
- Sentiment analysis integration
- Historical pattern matching

### Model Improvements
- Expand keyword dictionaries based on actual usage
- Machine learning-based quality scoring
- Category-specific quality criteria
- Regional dialect variations

## Testing Recommendations

### Test Cases
1. **Excellent descriptions**: Verify all quality indicators trigger
2. **Multi-lingual input**: Test with mixed languages
3. **Edge cases**: Very long descriptions, emoji usage, special characters
4. **Category variations**: Ensure keywords work across all categories

### Metrics to Track
- Average description length
- Quality score distribution
- User adoption of suggestions
- Impact on AI model accuracy
- Time to submission improvement

---

**Last Updated**: December 2024
**Version**: 1.0

